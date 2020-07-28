import { generateURL, isPlainObject } from './';
import history from './history';
import { createURL } from '@/router';

type GotoParams =
  | string
  | {
      /** 路由名称 */
      name?: string;
      /** 路由参数 */
      params?: GeneralObject;
      /** 页面地址 */
      url?: string;
      /** 页面参数 */
      query?: GeneralObject;
      /** 是否重定向 */
      redirect?: boolean;
    };

/**
 *
 * @param options
 * @example
 * goto('/search');
 * goto('/search', { keyword: 'hello world' });
 * or
 * goto({ url: '/search' });
 * goto({ url: '/search', query: { keyword: 'hello world' }});
 * or
 * goto({ name: 'search' });
 * goto({ name: 'search', query: { keyword: 'hello world' } });
 */

export const goto = (ops: GotoParams, query?: GeneralObject, redirect?: boolean) => {
  const options = isPlainObject(ops) ? ops : { url: ops, query, redirect };
  const { url = '', name, params = {} } = options;
  let link = generateURL(url, options.query);

  if (/^https?/i.test(link)) {
    const redirectType = options.redirect ? 'replace' : 'assign';
    window.location[redirectType](link);
    return;
  }

  if (name) {
    const URLs = createURL(name, params);
    URLs && (link = generateURL(URLs, options.query));
  }

  const type = options.redirect ? 'replace' : 'push';
  history[type](link);
};

export default goto;
