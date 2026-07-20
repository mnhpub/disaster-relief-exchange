import { D1Database } from '@cloudflare/workers-types';

export interface GetOpenRequestsQuery {
  incidentId: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

export interface RequestReadModel {
  id: string;
  incidentId: string;
  userId: string;
  resourceType: string;
  quantity: number;
  unit: string;
  latitude: number;
  longitude: number;
  priority: string;
  note?: string;
  status: string;
  createdAt: string;
}

export class GetOpenRequestsQueryHandler {
  constructor(private db: D1Database) {}

  async execute(query: GetOpenRequestsQuery): Promise<RequestReadModel[]> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    let sql = `
      SELECT 
        id,
        incident_id as incidentId,
        user_id as userId,
        resource_type as resourceType,
        quantity,
        unit,
        latitude,
        longitude,
        priority,
        note,
        status,
        created_at as createdAt
      FROM resource_requests
      WHERE incident_id = ? AND status = 'OPEN'
    `;

    const params: any[] = [query.incidentId];

    if (query.resourceType) {
      sql += ` AND resource_type = ?`;
      params.push(query.resourceType);
    }

    sql += ` ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .all();

    return ((result.results || []) as unknown as RequestReadModel[]);
  }
}
