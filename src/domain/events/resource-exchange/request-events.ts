import { IncidentId, RequestId, UserId, ResourceType, Location, NeedPriority, DomainEvent } from '../../value-objects/shared.js';

export class RequestCreated implements DomainEvent {
  readonly eventType = 'RequestCreated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version = 1;

  constructor(
    readonly requestId: RequestId,
    readonly incidentId: IncidentId,
    readonly userId: UserId,
    readonly resourceType: ResourceType,
    readonly quantity: number,
    readonly unit: string,
    readonly location: Location,
    readonly priority: NeedPriority,
    readonly note: string,
    readonly createdAt: Date
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = createdAt;
  }
}

export class RequestUpdated implements DomainEvent {
  readonly eventType = 'RequestUpdated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly requestId: RequestId,
    readonly changes: Record<string, unknown>,
    readonly updatedAt: Date,
    version: number
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = updatedAt;
    this.version = version;
  }
}

export class RequestMatched implements DomainEvent {
  readonly eventType = 'RequestMatched';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly requestId: RequestId,
    readonly offerId: string,
    readonly matchedAt: Date,
    version: number
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = matchedAt;
    this.version = version;
  }
}

export class RequestFulfilled implements DomainEvent {
  readonly eventType = 'RequestFulfilled';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly requestId: RequestId,
    readonly fulfilledAt: Date,
    version: number
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = fulfilledAt;
    this.version = version;
  }
}

export class RequestCancelled implements DomainEvent {
  readonly eventType = 'RequestCancelled';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly requestId: RequestId,
    readonly reason: string,
    readonly cancelledAt: Date,
    version: number
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = cancelledAt;
    this.version = version;
  }
}

export class RequestExpired implements DomainEvent {
  readonly eventType = 'RequestExpired';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly requestId: RequestId,
    readonly expiredAt: Date,
    version: number
  ) {
    this.aggregateId = requestId.value;
    this.timestamp = expiredAt;
    this.version = version;
  }
}
