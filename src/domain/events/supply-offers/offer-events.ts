import { IncidentId, OfferId, UserId, ResourceType, Location, DomainEvent } from '../../value-objects/shared.js';

export class OfferCreated implements DomainEvent {
  readonly eventType = 'OfferCreated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version = 1;

  constructor(
    readonly offerId: OfferId,
    readonly incidentId: IncidentId,
    readonly userId: UserId,
    readonly resourceType: ResourceType,
    readonly quantity: number,
    readonly unit: string,
    readonly location: Location,
    readonly availableUntil: Date,
    readonly note: string,
    readonly createdAt: Date
  ) {
    this.aggregateId = offerId.value;
    this.timestamp = createdAt;
  }
}

export class OfferUpdated implements DomainEvent {
  readonly eventType = 'OfferUpdated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly offerId: OfferId,
    readonly changes: Record<string, unknown>,
    readonly updatedAt: Date,
    version: number
  ) {
    this.aggregateId = offerId.value;
    this.timestamp = updatedAt;
    this.version = version;
  }
}

export class OfferReserved implements DomainEvent {
  readonly eventType = 'OfferReserved';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly offerId: OfferId,
    readonly requestId: string,
    readonly reservedQuantity: number,
    readonly reservedAt: Date,
    version: number
  ) {
    this.aggregateId = offerId.value;
    this.timestamp = reservedAt;
    this.version = version;
  }
}

export class OfferCompleted implements DomainEvent {
  readonly eventType = 'OfferCompleted';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly offerId: OfferId,
    readonly completedAt: Date,
    version: number
  ) {
    this.aggregateId = offerId.value;
    this.timestamp = completedAt;
    this.version = version;
  }
}

export class OfferWithdrawn implements DomainEvent {
  readonly eventType = 'OfferWithdrawn';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly offerId: OfferId,
    readonly reason: string,
    readonly withdrawnAt: Date,
    version: number
  ) {
    this.aggregateId = offerId.value;
    this.timestamp = withdrawnAt;
    this.version = version;
  }
}
