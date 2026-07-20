import { IncidentId, Location, DomainEvent } from '../../value-objects/shared.js';
import { IncidentCreated, IncidentOpened, IncidentClosed, AdvisoryPublished } from '../../events/incident/incident-events.js';
import { GovernancePolicies } from '../../policies/validation-policies.js';

export enum IncidentStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export class Incident {
  private uncommittedEvents: DomainEvent[] = [];
  private version = 0;

  constructor(
    private id: IncidentId,
    private title: string,
    private description: string,
    private location: Location,
    private status: IncidentStatus,
    private createdAt: Date,
    private closedAt?: Date,
    private closeReason?: string
  ) {}

  static create(
    title: string,
    description: string,
    location: Location
  ): Incident {
    const incidentId = IncidentId.create();
    const now = new Date();
    const incident = new Incident(
      incidentId,
      title,
      description,
      location,
      IncidentStatus.DRAFT,
      now
    );

    incident.recordEvent(
      new IncidentCreated(
        incidentId,
        title,
        description,
        location,
        now
      )
    );

    return incident;
  }

  getId(): IncidentId {
    return this.id;
  }

  getStatus(): IncidentStatus {
    return this.status;
  }

  getVersion(): number {
    return this.version;
  }

  open(): void {
    if (this.status !== IncidentStatus.DRAFT) {
      throw new Error('Only draft incidents can be opened');
    }

    this.status = IncidentStatus.OPEN;
    this.version++;

    this.recordEvent(
      new IncidentOpened(this.id, new Date(), this.version)
    );
  }

  close(reason: string): void {
    if (this.status !== IncidentStatus.OPEN) {
      throw new Error('Only open incidents can be closed');
    }

    const now = new Date();
    this.status = IncidentStatus.CLOSED;
    this.closedAt = now;
    this.closeReason = reason;
    this.version++;

    this.recordEvent(
      new IncidentClosed(this.id, now, reason, this.version)
    );
  }

  publishAdvisory(title: string, content: string): void {
    if (this.status !== IncidentStatus.OPEN) {
      throw new Error('Can only publish advisories for open incidents');
    }

    this.version++;

    this.recordEvent(
      new AdvisoryPublished(
        this.id,
        `advisory-${this.id.value}-${Date.now()}`,
        title,
        content,
        new Date(),
        this.version
      )
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
    if (event instanceof IncidentCreated) {
      this.title = event.title;
      this.description = event.description;
      this.location = event.location;
      this.status = IncidentStatus.DRAFT;
      this.version = 1;
    } else if (event instanceof IncidentOpened) {
      this.status = IncidentStatus.OPEN;
      this.version = event.version;
    } else if (event instanceof IncidentClosed) {
      this.status = IncidentStatus.CLOSED;
      this.closedAt = event.closedAt;
      this.closeReason = event.reason;
      this.version = event.version;
    }
  }
}
