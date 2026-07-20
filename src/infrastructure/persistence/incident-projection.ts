import { D1Database } from '@cloudflare/workers-types';
import { DomainEvent } from '../../domain/value-objects/shared.js';
import { IncidentCreated, IncidentOpened, IncidentClosed } from '../../domain/events/incident/incident-events.js';
import { Projection } from './projections.js';

export class IncidentProjection implements Projection {
  constructor(private db: D1Database) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof IncidentCreated) {
      await this.handleIncidentCreated(event);
    } else if (event instanceof IncidentOpened) {
      await this.handleIncidentOpened(event);
    } else if (event instanceof IncidentClosed) {
      await this.handleIncidentClosed(event);
    }
  }

  private async handleIncidentCreated(event: IncidentCreated): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT INTO incidents (
          id,
          title,
          description,
          latitude,
          longitude,
          status,
          created_at,
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        event.incidentId.value,
        event.title,
        event.description,
        event.location.latitude,
        event.location.longitude,
        'DRAFT',
        event.timestamp.toISOString(),
        event.version
      )
      .run();
  }

  private async handleIncidentOpened(event: IncidentOpened): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE incidents
        SET status = ?, version = ?
        WHERE id = ?
      `
      )
      .bind('OPEN', event.version, event.aggregateId)
      .run();
  }

  private async handleIncidentClosed(event: IncidentClosed): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE incidents
        SET status = ?, closed_at = ?, close_reason = ?, version = ?
        WHERE id = ?
      `
      )
      .bind(
        'CLOSED',
        event.closedAt.toISOString(),
        event.reason,
        event.version,
        event.aggregateId
      )
      .run();
  }
}
