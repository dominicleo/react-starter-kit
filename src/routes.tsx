import { Route } from 'universal-router';

const routes: Route = {
  path: '',
  component: '@/layouts/basic',
  children: [
    {
      path: '',
      title: '首页',
      component: () => import(/* webpackChunkName: 'home' */ '@/pages/home'),
    },
    {
      path: '/search',
      title: '搜索',
      component: '@/pages/search',
    },
    {
      path: '/user',
      component: '@/layouts/user',
      children: [
        {
          path: '',
          redirect: '/user/login',
        },
        {
          path: '/login',
          title: '登录',
          component: '@/pages/login',
        },
        {
          path: '/register',
          title: '注册',
          component: '@/pages/register',
        },
      ],
    },
    {
      path: '(.*)',
      title: 'Page Not Found',
      component: '@/pages/not-found',
    },
  ],
};

export default routes;
