import { D1Database } from '@cloudflare/workers-types';
import { DomainEvent } from '../../domain/value-objects/shared.js';
import {
  OfferCreated,
  OfferUpdated,
  OfferReserved,
  OfferCompleted,
  OfferWithdrawn
} from '../../domain/events/supply-offers/offer-events.js';
import { Projection } from './projections.js';

export class OfferProjection implements Projection {
  constructor(private db: D1Database) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof OfferCreated) {
      await this.handleOfferCreated(event);
    } else if (event instanceof OfferUpdated) {
      await this.handleOfferUpdated(event);
    } else if (event instanceof OfferReserved) {
      await this.handleOfferReserved(event);
    } else if (event instanceof OfferCompleted) {
      await this.handleOfferCompleted(event);
    } else if (event instanceof OfferWithdrawn) {
      await this.handleOfferWithdrawn(event);
    }
  }

  private async handleOfferCreated(event: OfferCreated): Promise<void> {
    await this.db
      .prepare(
        `
        INSERT INTO supply_offers (
          id,
          incident_id,
          user_id,
          resource_type,
          quantity,
          unit,
          latitude,
          longitude,
          available_until,
          note,
          status,
          created_at,
          version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        event.offerId.value,
        event.incidentId.value,
        event.userId.value,
        event.resourceType,
        event.quantity,
        event.unit,
        event.location.latitude,
        event.location.longitude,
        event.availableUntil.toISOString(),
        event.note,
        'AVAILABLE',
        event.createdAt.toISOString(),
        event.version
      )
      .run();
  }

  private async handleOfferUpdated(event: OfferUpdated): Promise<void> {
    const changes = event.changes as any;

    let sql = 'UPDATE supply_offers SET version = ?';
    const params: any[] = [event.version];

    if (changes.quantity !== undefined) {
      sql += ', quantity = ?';
      params.push(changes.quantity);
    }
    if (changes.note !== undefined) {
      sql += ', note = ?';
      params.push(changes.note);
    }
    if (changes.availableUntil !== undefined) {
      sql += ', available_until = ?';
      params.push(changes.availableUntil);
    }

    sql += ' WHERE id = ?';
    params.push(event.aggregateId);

    await this.db.prepare(sql).bind(...params).run();
  }

  private async handleOfferReserved(event: OfferReserved): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE supply_offers
        SET status = ?, reserved_quantity = ?, matched_request_id = ?, version = ?
        WHERE id = ?
      `
      )
      .bind(
        'RESERVED',
        event.reservedQuantity,
        event.requestId,
        event.version,
        event.aggregateId
      )
      .run();
  }

  private async handleOfferCompleted(event: OfferCompleted): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE supply_offers
        SET status = ?, completed_at = ?, version = ?
        WHERE id = ?
      `
      )
      .bind(
        'COMPLETED',
        event.completedAt.toISOString(),
        event.version,
        event.aggregateId
      )
      .run();
  }

  private async handleOfferWithdrawn(event: OfferWithdrawn): Promise<void> {
    await this.db
      .prepare(
        `
        UPDATE supply_offers
        SET status = ?, version = ?
        WHERE id = ?
      `
      )
      .bind('WITHDRAWN', event.version, event.aggregateId)
      .run();
  }
}
