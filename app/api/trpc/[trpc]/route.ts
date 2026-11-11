import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '../../../../src/server/api/context';
import { appRouter } from '../../../../src/server/api/root';

function handler(req: Request) {
  if (req.method === 'POST') {
    const url = new URL(req.url);
    // Next.js normalizes loopback hosts in req.url. Use the host sent by the browser.
    const host = req.headers.get('host') ?? url.host;
    if (req.headers.get('origin') !== `${url.protocol}//${host}`) {
      return new Response(null, { status: 403 });
    }
  }
  return fetchRequestHandler({ endpoint: '/api/trpc', req, router: appRouter, createContext, responseMeta: () => ({
    headers: { 'cache-control': 'private, no-store' },
  }) });
}

export { handler as GET, handler as POST };
