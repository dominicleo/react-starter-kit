import { Route } from 'universal-router';
import BasicLayout from '@/layouts/basic';
import LoginRegister from '@/layouts/login-register';

const routes: Route = {
  path: '',
  children: [
    {
      path: '',
      component: BasicLayout,
      children: [
        {
          path: '',
          title: '首页',
          chunk: 'home',
          load: () => import(/* webpackChunkName: 'home' */ '@/pages/home'),
        },
        {
          path: '/search',
          title: '搜索',
          chunk: 'search',
          load: () => import(/* webpackChunkName: 'search' */ '@/pages/search'),
        },
        {
          path: '/user',
          component: LoginRegister,
          children: [
            {
              path: '',
              redirect: '/user/login',
            },
            {
              path: '/login',
              title: '登录',
              chunk: 'login',
              load: () => import(/* webpackChunkName: 'login' */ '@/pages/login'),
            },
            {
              path: '/register',
              title: '注册',
              chunk: 'login',
              load: () => import(/* webpackChunkName: 'register' */ '@/pages/register'),
            },
          ],
        },
        {
          path: '(.*)',
          title: 'Page Not Found',
          chunk: 'not-found',
          load: () => import(/* webpackChunkName: 'not-found' */ '@/pages/not-found'),
        },
      ],
    },
  ],
  async action({ next }: any) {
    const route = await next();
    route.title = route.title || '';
    route.description = route.description || '';
    return route;
  },
};

if (__DEV__) {
  routes.children?.unshift({
    path: '/error',
    action: require('./pages/error').default,
  });
}

export default routes;
