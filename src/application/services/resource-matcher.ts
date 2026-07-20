import { D1Database } from '@cloudflare/workers-types';
import { IncidentId, RequestId, OfferId } from '../../domain/value-objects/shared.js';
import { EventStoreAdapter } from '../../infrastructure/persistence/event-store.js';
import { EventBus } from '../../infrastructure/messaging/event-bus.js';

export interface MatchResult {
  requestId: string;
  offerId: string;
  matchedQuantity: number;
  distance?: number;
}

export class ResourceMatcher {
  constructor(
    private db: D1Database,
    private eventStore: EventStoreAdapter,
    private eventBus: EventBus
  ) {}

  async findMatchesForRequest(requestId: string): Promise<MatchResult[]> {
    // Get request details
    const requestResult = await this.db
      .prepare(
        `
        SELECT quantity, resource_type, latitude, longitude
        FROM resource_requests
        WHERE id = ? AND status = 'OPEN'
      `
      )
      .first();

    if (!requestResult) {
      throw new Error(`Request ${requestId} not found or not open`);
    }

    const req = requestResult as any;

    // Find matching offers within reasonable distance
    const offersResult = await this.db
      .prepare(
        `
        SELECT 
          id,
          quantity,
          latitude,
          longitude,
          (
            6371 * 2 * ASIN(
              SQRT(
                POWER(SIN((? - latitude) * 3.14159 / 180 / 2), 2) +
                COS(latitude * 3.14159 / 180) *
                COS(? * 3.14159 / 180) *
                POWER(SIN((? - longitude) * 3.14159 / 180 / 2), 2)
              )
            )
          ) as distance
        FROM supply_offers
        WHERE 
          resource_type = ? 
          AND status = 'AVAILABLE'
          AND quantity > 0
        ORDER BY distance ASC
        LIMIT 5
      `
      )
      .bind(
        req.latitude as number,
        req.latitude as number,
        req.longitude as number,
        req.resource_type
      )
      .all();

    const matches: MatchResult[] = ((offersResult.results || []) as any[]).map((offer: any) => ({
      requestId,
      offerId: offer.id,
      matchedQuantity: Math.min(
        offer.quantity,
        req.quantity
      ),
      distance: Math.round((offer.distance as number) * 10) / 10
    }));

    return matches;
  }

  async getHighestPriorityOpenRequest(incidentId: string): Promise<string | null> {
    const result = await this.db
      .prepare(
        `
        SELECT id
        FROM resource_requests
        WHERE incident_id = ? AND status = 'OPEN'
        ORDER BY 
          CASE priority
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END,
          created_at ASC
        LIMIT 1
      `
      )
      .bind(incidentId)
      .first();

    if (!result) {
      return null;
    }

    return (result as any).id as string;
  }
}
