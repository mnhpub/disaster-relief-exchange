import { D1Database } from '@cloudflare/workers-types';

export interface GetMostNeededTodayQuery {
  incidentId: string;
  limit?: number;
}

export interface MostNeededReadModel {
  resourceType: string;
  totalRequests: number;
  unfulfilledRequests: number;
  lastUpdated: string;
}

export class GetMostNeededTodayQueryHandler {
  constructor(private db: D1Database) {}

  async execute(query: GetMostNeededTodayQuery): Promise<MostNeededReadModel[]> {
    const limit = query.limit || 10;

    const result = await this.db
      .prepare(
        `
        SELECT 
          resource_type as resourceType,
          total_requests as totalRequests,
          unfulfilled_requests as unfulfilledRequests,
          last_updated as lastUpdated
        FROM most_needed_today
        WHERE incident_id = ?
        ORDER BY unfulfilled_requests DESC
        LIMIT ?
      `
      )
      .bind(query.incidentId, limit)
      .all();

    return ((result.results || []) as unknown as MostNeededReadModel[]);
  }
}
