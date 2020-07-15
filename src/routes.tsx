import { Route } from 'universal-router';
import BasicLayout from '@/layouts/basic';
import LoginRegister from '@/layouts/login-register';

const routes: Route = {
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
      path: '/user',
      component: LoginRegister,
      redirect: '/user/login',
      children: [
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
      chunk: 'not-found',
      load: () => import(/* webpackChunkName: 'not-found' */ '@/pages/not-found'),
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
