import { D1Database } from '@cloudflare/workers-types';
import { DomainEvent } from '../../domain/value-objects/shared.js';
import {
  RequestCreated,
  RequestUpdated,
  RequestMatched,
  RequestFulfilled,
  RequestCancelled,
  RequestExpired
} from '../../domain/events/resource-exchange/request-events.js';
import { Projection } from './projections.js';

export class RequestProjection implements Projection {
  constructor(private db: D1Database) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof RequestCreated) {
      await this.handleRequestCreated(event);
    } else if (event instanceof RequestUpdated) {
      await this.handleRequestUpdated(event);
    } else if (event instanceof RequestMatched) {
      await this.handleRequestMatched(event);
    } else if (event instanceof RequestFulfilled) {
      await this.handleRequestFulfilled(event);
    } else if (event instanceof RequestCancelled) {
      await this.handleRequestCancelled(event);
    } else if (event instanceof RequestExpired) {
      await this.handleRequestExpired(event);
    }
  }

  private async handleRequestCreated(event: RequestCreated): Promise<void> {
    const expiresAt = new Date(event.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.db
      .prepare(
        `
        INSERT INTO resource_requests (
          id,
          incident_id,
          user_id,
          resource_type,
          quantity,
          unit,
          latitude,
          longitude,
          priority,
          note,
          status,
          created_at,
          expires_at,
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        event.requestId.value,
        event.incidentId.value,
        event.userId.value,
        event.resourceType,
        event.quantity,
        event.unit,
        event.location.latitude,
        event.location.longitude,
        event.priority,
        event.note,
        'OPEN',
        event.createdAt.toISOString(),
        expiresAt.toISOString(),
        event.version
      )
      .run();

    // Update most_needed_today aggregate
    await this.updateMostNeededToday(
      event.incidentId.value,
      event.resourceType
    );
  }

  private async handleRequestUpdated(event: RequestUpdated): Promise<void> {
    const changes = event.changes as any;

    let sql = 'UPDATE resource_requests SET version = ?';
    const params: any[] = [event.version];

    if (changes.quantity !== undefined) {
      sql += ', quantity = ?';
      params.push(changes.quantity);
    }
    if (changes.priority !== undefined) {
      sql += ', priority = ?';
      params.push(changes.priority);
    }
    if (changes.note !== undefined) {
      sql += ', note = ?';
      params.push(changes.note);
    }
    if (changes.location !== undefined) {
      sql += ', latitude = ?, longitude = ?';
      params.push(changes.location.latitude, changes.location.longitude);
    }

    sql += ' WHERE id = ?';
    params.push(event.aggregateId);

    await this.db.prepare(sql).bind(...params).run();
  }

  private async handleRequestMatched(event: RequestMatched): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE resource_requests
        SET status = ?, version = ?
        WHERE id = ?
      `
      )
      .bind('MATCHED', event.version, event.aggregateId)
      .run();
  }

  private async handleRequestFulfilled(event: RequestFulfilled): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE resource_requests
        SET status = ?, fulfilled_at = ?, version = ?
        WHERE id = ?
      `
      )
      .bind(
        'FULFILLED',
        event.fulfilledAt.toISOString(),
        event.version,
        event.aggregateId
      )
      .run();
  }

  private async handleRequestCancelled(event: RequestCancelled): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE resource_requests
        SET status = ?, cancelled_at = ?, version = ?
        WHERE id = ?
      `
      )
      .bind(
        'CANCELLED',
        event.timestamp.toISOString(),
        event.version,
        event.aggregateId
      )
      .run();
  }

  private async handleRequestExpired(event: RequestExpired): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE resource_requests
        SET status = ?, version = ?
        WHERE id = ?
      `
      )
      .bind('EXPIRED', event.version, event.aggregateId)
      .run();
  }

  private async updateMostNeededToday(
    incidentId: string,
    resourceType: string
  ): Promise<void> {
    const result = await this.db
      .prepare(
        `
        SELECT COUNT(*) as total_requests
        FROM resource_requests
        WHERE incident_id = ? AND resource_type = ? AND status != 'FULFILLED'
      `
      )
      .bind(incidentId, resourceType)
      .first();

    const counts = result as any;
    const totalRequests = counts?.total_requests || 0;
    const unfulfilledRequests = totalRequests;

    await this.db
      .prepare(
        `
        INSERT INTO most_needed_today (
          id,
          incident_id,
          resource_type,
          total_requests,
          unfulfilled_requests,
          last_updated
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(incident_id, resource_type) DO UPDATE SET
          total_requests = ?,
          unfulfilled_requests = ?,
          last_updated = ?
      `
      )
      .bind(
        `${incidentId}-${resourceType}`,
        incidentId,
        resourceType,
        totalRequests,
        unfulfilledRequests,
        new Date().toISOString(),
        totalRequests,
        unfulfilledRequests,
        new Date().toISOString()
      )
      .run();
  }
}
