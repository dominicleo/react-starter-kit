import qs from 'qs';
import React from 'react';
import UniversalRouter, { Route } from 'universal-router';
import generateUrls from 'universal-router/generateUrls';
import routes from '@/routes';

const findParentRouteChunk = (route: Route) => {
  const chunks: string[] = [];
  const { parent } = route;

  if (parent && parent.chunk) {
    chunks.push(parent.chunk);
  }

  // if (parent && parent.chunk) {
  //   chunks.push(parent.chunk);
  //   parent.parent && chunks.push(findParentRouteChunk(parent));
  // }

  return chunks;
};

const router = new UniversalRouter(routes, {
  async resolveRoute(context) {
    if (typeof context.route.path === 'string' && context.route.redirect) {
      return context.route;
    }

    console.log(context.route);

    if (typeof context.route.component === 'function') {
      return context.route.component().then(async (action: any) => {
        const children = await context.next();

        return {
          ...context.route,
          ...children,
          chunks: [context.route.chunk, children?.chunk].filter(Boolean),
          component: React.createElement(action.default, context, children?.component),
        };
      });
    }
    // if (typeof context.route.load === 'function') {
    //   return context.route
    //     .load()
    //     .then(async (action: any) => {
    //       const { route } = context;
    //       const component = React.createElement(action.default, context);
    //       route.component = component;
    //       return route;
    //     })
    //     .then((route: any) => ({ ...route, params }));
    // }

    // if (typeof context.route.action === 'function') {
    //   const action = await context.route.action(context, params);
    //   if (context.route.component) {
    //     action.component = React.createElement(context.route.component, context, action.component);
    //   }
    //   return action;
    // }

    // if (context.route.component) {
    //   const { route } = context;
    //   const childrenRoute = await context.next();
    //   if (childrenRoute) {
    //     childrenRoute.component = React.createElement(
    //       context.route.component,
    //       context,
    //       childrenRoute.component,
    //     );
    //     return childrenRoute;
    //   }
    //   return route;
    // }

    // if (context.route.redirect && !context.route.children) {
    //   return context.route;
    // }

    return undefined;
  },
});

export const createURL = generateUrls(router, {
  stringifyQueryParams: qs.stringify,
});

export default router;
