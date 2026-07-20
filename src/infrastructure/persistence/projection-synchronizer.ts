import { D1Database } from '@cloudflare/workers-types';
import { EventStoreAdapter } from './event-store.js';
import { ProjectionRegistry } from './projections.js';
import { IncidentProjection } from './incident-projection.js';
import { RequestProjection } from './request-projection.js';
import { OfferProjection } from './offer-projection.js';

export interface ProjectionCheckpoint {
  lastProcessedVersion: number;
  lastProcessedTimestamp: Date;
}

export class ProjectionSynchronizer {
  private checkpoint: ProjectionCheckpoint = {
    lastProcessedVersion: 0,
    lastProcessedTimestamp: new Date(0)
  };

  private registry: ProjectionRegistry;

  constructor(
    private db: D1Database,
    private eventStore: EventStoreAdapter
  ) {
    this.registry = new ProjectionRegistry();
    this.initializeProjections();
  }

  private initializeProjections(): void {
    const incidentProjection = new IncidentProjection(this.db);
    const requestProjection = new RequestProjection(this.db);
    const offerProjection = new OfferProjection(this.db);

    this.registry.register('IncidentCreated', incidentProjection);
    this.registry.register('IncidentOpened', incidentProjection);
    this.registry.register('IncidentClosed', incidentProjection);

    this.registry.register('RequestCreated', requestProjection);
    this.registry.register('RequestUpdated', requestProjection);
    this.registry.register('RequestMatched', requestProjection);
    this.registry.register('RequestFulfilled', requestProjection);
    this.registry.register('RequestCancelled', requestProjection);
    this.registry.register('RequestExpired', requestProjection);

    this.registry.register('OfferCreated', offerProjection);
    this.registry.register('OfferUpdated', offerProjection);
    this.registry.register('OfferReserved', offerProjection);
    this.registry.register('OfferCompleted', offerProjection);
    this.registry.register('OfferWithdrawn', offerProjection);
  }

  async synchronize(): Promise<void> {
    try {
      const events = await this.eventStore.getAllEventsSince(
        this.checkpoint.lastProcessedTimestamp
      );

      if (events.length === 0) {
        return;
      }

      await this.registry.handleBatch(events);

      const lastEvent = events[events.length - 1];
      this.checkpoint.lastProcessedTimestamp = lastEvent.timestamp;
      this.checkpoint.lastProcessedVersion = lastEvent.version;
    } catch (error) {
      console.error('Error synchronizing projections:', error);
      throw error;
    }
  }

  getCheckpoint(): ProjectionCheckpoint {
    return { ...this.checkpoint };
  }

  setCheckpoint(checkpoint: ProjectionCheckpoint): void {
    this.checkpoint = { ...checkpoint };
  }
}
