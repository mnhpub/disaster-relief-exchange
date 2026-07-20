import { IncidentId, Location, DomainEvent } from '../../value-objects/shared.js';

export class IncidentCreated implements DomainEvent {
  readonly eventType = 'IncidentCreated';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version = 1;

  constructor(
    readonly incidentId: IncidentId,
    readonly title: string,
    readonly description: string,
    readonly location: Location,
    readonly createdAt: Date
  ) {
    this.aggregateId = incidentId.value;
    this.timestamp = createdAt;
  }
}

export class IncidentOpened implements DomainEvent {
  readonly eventType = 'IncidentOpened';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly incidentId: IncidentId,
    readonly openedAt: Date,
    version: number
  ) {
    this.aggregateId = incidentId.value;
    this.timestamp = openedAt;
    this.version = version;
  }
}

export class IncidentClosed implements DomainEvent {
  readonly eventType = 'IncidentClosed';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly incidentId: IncidentId,
    readonly closedAt: Date,
    readonly reason: string,
    version: number
  ) {
    this.aggregateId = incidentId.value;
    this.timestamp = closedAt;
    this.version = version;
  }
}

export class AdvisoryPublished implements DomainEvent {
  readonly eventType = 'AdvisoryPublished';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly version: number;

  constructor(
    readonly incidentId: IncidentId,
    readonly advisoryId: string,
    readonly title: string,
    readonly content: string,
    readonly publishedAt: Date,
    version: number
  ) {
    this.aggregateId = incidentId.value;
    this.timestamp = publishedAt;
    this.version = version;
  }
}
