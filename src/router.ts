import React from 'react';
import UniversalRouter from 'universal-router';
import routes from '@/routes';

export default new UniversalRouter(routes, {
  async resolveRoute(context, params) {
    if (context.route.component) {
      const { redirect } = context.route;
      const childrenRoute = await context.next();
      const component = React.createElement(
        context.route.component,
        context,
        childrenRoute?.component,
      );

      return { redirect, ...childrenRoute, component };
    }
    if (typeof context.route.load === 'function') {
      return context.route
        .load()
        .then((action: any) => {
          const { title, status, redirect, chunk, chunks } = context.route;
          const component = React.createElement(action.default, context);

          return { title, status, redirect, chunk, chunks, component };
        })
        .then((route: any) => ({ ...route, params }));
    }
    if (typeof context.route.action === 'function') {
      return context.route.action(context, params);
    }

    return undefined;
  },
});
