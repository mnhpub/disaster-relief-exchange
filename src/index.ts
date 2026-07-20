import { D1Database } from '@cloudflare/workers-types';
import { CreateIncidentHandler } from './application/command-handlers/incident/create-incident-handler.js';
import { CreateRequestHandler } from './application/command-handlers/resource-exchange/create-request-handler.js';
import { FulfillRequestHandler } from './application/command-handlers/resource-exchange/fulfill-request-handler.js';
import { GetIncidentsQueryHandler } from './application/query-handlers/incident/get-incidents-query-handler.js';
import { GetOpenRequestsQueryHandler } from './application/query-handlers/resource-exchange/get-open-requests-query-handler.js';
import { GetMostNeededTodayQueryHandler } from './application/query-handlers/resource-exchange/get-most-needed-today-query-handler.js';
import { D1EventStore } from './infrastructure/persistence/event-store.js';
import { EventBus } from './infrastructure/messaging/event-bus.js';
import { CreateIncident } from './domain/commands/incident/incident-commands.js';
import { Location } from './domain/value-objects/shared.js';

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Initialize services
    const eventStore = new D1EventStore(env.DB);
    const eventBus = new EventBus();

    try {
      // Health check
      if (path === '/health' && method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', environment: env.ENVIRONMENT }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // === Incident Endpoints ===

      if (path === '/api/incidents' && method === 'GET') {
        const handler = new GetIncidentsQueryHandler(env.DB);
        const incidents = await handler.execute({
          limit: 10,
          offset: 0
        });
        return new Response(JSON.stringify({ incidents }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/incidents' && method === 'POST') {
        try {
          const body = await request.json() as any;
          const handler = new CreateIncidentHandler(eventStore);
          const command = new CreateIncident(
            body.title,
            body.description,
            Location.create(body.latitude, body.longitude)
          );
          const incidentId = await handler.execute(command);

          return new Response(
            JSON.stringify({ incidentId: incidentId.value }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // === Request Endpoints ===

      if (path === '/api/requests' && method === 'GET') {
        const incidentId = url.searchParams.get('incidentId');
        if (!incidentId) {
          return new Response(
            JSON.stringify({ error: 'incidentId query parameter required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const handler = new GetOpenRequestsQueryHandler(env.DB);
        const requests = await handler.execute({
          incidentId,
          limit: 20,
          offset: 0
        });
        return new Response(JSON.stringify({ requests }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/requests' && method === 'POST') {
        try {
          const body = await request.json() as any;
          const handler = new CreateRequestHandler(eventStore);

          // This will be improved with proper auth context
          const command = {
            incidentId: { value: body.incidentId } as any,
            resourceType: body.resourceType,
            quantity: body.quantity,
            unit: body.unit,
            location: Location.create(body.latitude, body.longitude),
            priority: body.priority,
            note: body.note
          };

          const requestId = await handler.execute(command as any);

          return new Response(
            JSON.stringify({ requestId: requestId.value }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // === Most Needed Today ===

      if (path === '/api/most-needed-today' && method === 'GET') {
        const incidentId = url.searchParams.get('incidentId');
        if (!incidentId) {
          return new Response(
            JSON.stringify({ error: 'incidentId query parameter required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const handler = new GetMostNeededTodayQueryHandler(env.DB);
        const items = await handler.execute({
          incidentId,
          limit: 10
        });
        return new Response(JSON.stringify({ items }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 404
      return new Response('404 - Not Found', { status: 404 });
    } catch (error: any) {
      console.error('Unhandled error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
