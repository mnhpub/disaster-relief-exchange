import { D1Database } from '@cloudflare/workers-types';
import { DomainEvent } from '../../domain/value-objects/shared.js';

export interface Projection {
  handle(event: DomainEvent): Promise<void>;
}

export class ProjectionRegistry {
  private projections: Map<string, Projection[]> = new Map();

  register(eventType: string, projection: Projection): void {
    if (!this.projections.has(eventType)) {
      this.projections.set(eventType, []);
    }
    this.projections.get(eventType)!.push(projection);
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    const projections = this.projections.get(event.eventType) || [];
    
    for (const projection of projections) {
      try {
        await projection.handle(event);
      } catch (error) {
        console.error(
          `Error handling ${event.eventType} in projection:`,
          error
        );
        throw error;
      }
    }
  }

  async handleBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.handleEvent(event);
    }
  }
}
