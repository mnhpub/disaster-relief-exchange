import { D1Database } from '@cloudflare/workers-types';

export interface GetIncidentsQuery {
  limit?: number;
  offset?: number;
}

export interface IncidentReadModel {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  closedAt?: string;
  closeReason?: string;
}

export class GetIncidentsQueryHandler {
  constructor(private db: D1Database) {}

  async execute(query: GetIncidentsQuery): Promise<IncidentReadModel[]> {
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const result = await this.db
      .prepare(
        `
        SELECT 
          id,
          title,
          description,
          latitude,
          longitude,
          status,
          created_at as createdAt,
          closed_at as closedAt,
          close_reason as closeReason
        FROM incidents
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .bind(limit, offset)
      .all();

    return ((result.results || []) as unknown as IncidentReadModel[]);
  }
}
