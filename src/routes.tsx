import { Route } from 'universal-router';

const routes: Route = {
  path: '',

  children: [
    {
      path: '',
      load: () => import(/* webpackChunkName: 'home' */ '@/pages/home'),
    },

    {
      path: '(.*)',
      load: () => import(/* webpackChunkName: 'not-found' */ '@/pages/not-found'),
    },
  ],

  async action({ next }: any) {
    const route = await next();
    route.title = `${route.title || 'Untitled Page'} - www.reactstarterkit.com`;
    route.description = route.description || '';

    return route;
  },
};

// The error page is available by permanent url for development mode
if (__DEV__) {
  routes.children?.unshift({
    path: '/error',
    action: require('./pages/error').default,
  });
}

export default routes;
