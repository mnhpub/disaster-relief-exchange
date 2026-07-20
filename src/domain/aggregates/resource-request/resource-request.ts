import { IncidentId, RequestId, UserId, ResourceType, Location, NeedPriority, DomainEvent } from '../../value-objects/shared.js';
import { RequestCreated, RequestUpdated, RequestMatched, RequestFulfilled, RequestCancelled, RequestExpired } from '../../events/resource-exchange/request-events.js';
import { GovernancePolicies } from '../../policies/validation-policies.js';

export enum RequestStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export class ResourceRequest {
  private uncommittedEvents: DomainEvent[] = [];
  private version = 0;
  private matchedOfferId?: string;

  constructor(
    private id: RequestId,
    private incidentId: IncidentId,
    private userId: UserId,
    private resourceType: ResourceType,
    private quantity: number,
    private unit: string,
    private location: Location,
    private priority: NeedPriority,
    private note: string,
    private status: RequestStatus,
    private createdAt: Date,
    private expiresAt?: Date,
    private fulfilledAt?: Date
  ) {}

  static create(
    incidentId: IncidentId,
    userId: UserId,
    resourceType: ResourceType,
    quantity: number,
    unit: string,
    location: Location,
    priority: NeedPriority,
    note: string
  ): ResourceRequest {
    const requestId = RequestId.create();
    const now = new Date();
    const request = new ResourceRequest(
      requestId,
      incidentId,
      userId,
      resourceType,
      quantity,
      unit,
      location,
      priority,
      note,
      RequestStatus.OPEN,
      now,
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    );

    request.recordEvent(
      new RequestCreated(
        requestId,
        incidentId,
        userId,
        resourceType,
        quantity,
        unit,
        location,
        priority,
        note,
        now
      )
    );

    return request;
  }

  getId(): RequestId {
    return this.id;
  }

  getStatus(): RequestStatus {
    return this.status;
  }

  getVersion(): number {
    return this.version;
  }

  update(changes: {
    quantity?: number;
    priority?: NeedPriority;
    note?: string;
    location?: Location;
  }): void {
    const violation = GovernancePolicies.validateFulfilledRequestsAreImmutable(
      this.status
    );
    if (violation) throw new Error(violation.message);

    const expiredViolation = GovernancePolicies.validateExpiredRequestsCannotBeModified(
      this.status
    );
    if (expiredViolation) throw new Error(expiredViolation.message);

    if (changes.quantity !== undefined) this.quantity = changes.quantity;
    if (changes.priority !== undefined) this.priority = changes.priority;
    if (changes.note !== undefined) this.note = changes.note;
    if (changes.location !== undefined) this.location = changes.location;

    this.version++;

    this.recordEvent(
      new RequestUpdated(this.id, changes, new Date(), this.version)
    );
  }

  matchOffer(offerId: string): void {
    if (this.status !== RequestStatus.OPEN) {
      throw new Error('Only open requests can be matched');
    }

    this.status = RequestStatus.MATCHED;
    this.matchedOfferId = offerId;
    this.version++;

    this.recordEvent(
      new RequestMatched(this.id, offerId, new Date(), this.version)
    );
  }

  fulfill(): void {
    if (this.status !== RequestStatus.MATCHED) {
      throw new Error('Only matched requests can be fulfilled');
    }

    const now = new Date();
    this.status = RequestStatus.FULFILLED;
    this.fulfilledAt = now;
    this.version++;

    this.recordEvent(
      new RequestFulfilled(this.id, now, this.version)
    );
  }

  cancel(reason: string): void {
    const violation = GovernancePolicies.validateFulfilledRequestsAreImmutable(
      this.status
    );
    if (violation) throw new Error(violation.message);

    this.status = RequestStatus.CANCELLED;
    this.version++;

    this.recordEvent(
      new RequestCancelled(this.id, reason, new Date(), this.version)
    );
  }

  expire(): void {
    if (this.status === RequestStatus.FULFILLED || this.status === RequestStatus.CANCELLED) {
      throw new Error('Cannot expire already closed requests');
    }

    this.status = RequestStatus.EXPIRED;
    this.version++;

    this.recordEvent(
      new RequestExpired(this.id, new Date(), this.version)
    );
  }

  private recordEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event);
    }
  }

  private applyEvent(event: DomainEvent): void {
    if (event instanceof RequestCreated) {
      this.resourceType = event.resourceType;
      this.quantity = event.quantity;
      this.unit = event.unit;
      this.location = event.location;
      this.priority = event.priority;
      this.note = event.note;
      this.status = RequestStatus.OPEN;
      this.version = 1;
    } else if (event instanceof RequestMatched) {
      this.status = RequestStatus.MATCHED;
      this.matchedOfferId = event.offerId;
      this.version = event.version;
    } else if (event instanceof RequestFulfilled) {
      this.status = RequestStatus.FULFILLED;
      this.fulfilledAt = event.fulfilledAt;
      this.version = event.version;
    } else if (event instanceof RequestCancelled) {
      this.status = RequestStatus.CANCELLED;
      this.version = event.version;
    } else if (event instanceof RequestExpired) {
      this.status = RequestStatus.EXPIRED;
      this.version = event.version;
    }
  }
}
