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

    // Health check
    if (path === '/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Incidents endpoints
    if (path === '/api/incidents' && method === 'GET') {
      try {
        const result = await env.DB
          .prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10')
          .all();
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch incidents' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path === '/api/incidents' && method === 'POST') {
      return new Response(JSON.stringify({ message: 'Create incident' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Requests endpoints
    if (path === '/api/requests' && method === 'POST') {
      return new Response(JSON.stringify({ message: 'Create resource request' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Offers endpoints
    if (path === '/api/offers' && method === 'POST') {
      return new Response(JSON.stringify({ message: 'Create supply offer' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 404
    return new Response('404 - Not Found', { status: 404 });
  }
};
