import 'universal-router';

declare module 'universal-router' {
  interface Route<C extends Context = any, R = any> {
    /** 页面标题 */
    title?: string;
    /** 重定向到指定页面 */
    redirect?: string;
    chunk?: string;
    chunks?: string[];
    load?: () => Promise<any>;
    component?: React.ReactNode;
  }

  interface RouteContext<C extends Context = any, R = any> extends RouteContext {
    [key: string]: any;
  }
}
