import { D1Database } from '@cloudflare/workers-types';
import { DomainEvent } from '../../domain/value-objects/shared.js';

export interface EventStoreAdapter {
  append(
    aggregateId: string,
    aggregateType: string,
    event: DomainEvent,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  getEvents(
    aggregateId: string
  ): Promise<DomainEvent[]>;

  getAllEventsSince(
    timestamp: Date
  ): Promise<DomainEvent[]>;

  getEventsByType(
    eventType: string
  ): Promise<DomainEvent[]>;
}

export class D1EventStore implements EventStoreAdapter {
  constructor(private db: D1Database) {}

  async append(
    aggregateId: string,
    aggregateType: string,
    event: DomainEvent,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const payload = this.serializeEvent(event);

    await this.db
      .prepare(
        `
        INSERT INTO events (
          aggregate_id,
          aggregate_type,
          event_type,
          payload,
          version,
          timestamp,
          metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        aggregateId,
        aggregateType,
        event.eventType,
        JSON.stringify(payload),
        event.version,
        event.timestamp.toISOString(),
        JSON.stringify(metadata || {})
      )
      .run();
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const result = await this.db
      .prepare(
        `
        SELECT payload, event_type, version, timestamp
        FROM events
        WHERE aggregate_id = ?
        ORDER BY version ASC
      `
      )
      .bind(aggregateId)
      .all();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    return result.results.map(row => this.deserializeEvent(row));
  }

  async getAllEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    const result = await this.db
      .prepare(
        `
        SELECT payload, event_type, version, timestamp
        FROM events
        WHERE timestamp > ?
        ORDER BY timestamp ASC
      `
      )
      .bind(timestamp.toISOString())
      .all();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    return result.results.map(row => this.deserializeEvent(row));
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const result = await this.db
      .prepare(
        `
        SELECT payload, event_type, version, timestamp
        FROM events
        WHERE event_type = ?
        ORDER BY timestamp DESC
      `
      )
      .bind(eventType)
      .all();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    return result.results.map(row => this.deserializeEvent(row));
  }

  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    return {
      ...event,
      timestamp: (event as any).timestamp?.toISOString?.() || new Date().toISOString()
    };
  }

  private deserializeEvent(row: any): DomainEvent {
    const payload = typeof row.payload === 'string' 
      ? JSON.parse(row.payload) 
      : row.payload;

    return {
      ...payload,
      timestamp: new Date(row.timestamp || payload.timestamp),
      eventType: row.event_type,
      version: row.version
    };
  }
}
