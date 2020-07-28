import qs from 'qs';
import React from 'react';
import UniversalRouter from 'universal-router';
import generateUrls from 'universal-router/generateUrls';
import routes from '@/routes';

const router = new UniversalRouter(routes, {
  async resolveRoute(context, params) {
    if (typeof context.route.load === 'function') {
      return context.route
        .load()
        .then(async (action: any) => {
          const { route } = context;
          const component = React.createElement(action.default, context);
          route.component = component;
          return route;
        })
        .then((route: any) => ({ ...route, params }));
    }

    if (typeof context.route.action === 'function') {
      const action = await context.route.action(context, params);
      if (context.route.component) {
        action.component = React.createElement(context.route.component, context, action.component);
      }
      return action;
    }

    if (context.route.component) {
      const { route } = context;
      const childrenRoute = await context.next();
      if (childrenRoute) {
        childrenRoute.component = React.createElement(
          context.route.component,
          context,
          childrenRoute.component,
        );
        return childrenRoute;
      }
      return route;
    }

    if (context.route.redirect && !context.route.children) {
      return context.route;
    }

    return undefined;
  },
});

export const createURL = generateUrls(router, {
  stringifyQueryParams: qs.stringify,
});

export default router;
