import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import '../../../../server/bootstrap';
import { appRouter } from '../../../../server/trpc/routers/_app';
import { createContext } from '../../../../server/trpc/context';

function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
