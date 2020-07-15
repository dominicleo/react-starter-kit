declare const __DEV__: boolean;
interface Window {
  __APP__: any;
  chrome: any;
  flexible: any;
}
interface NodeModule {
  hot: any;
}

// Extend existing modules
declare module 'child_process' {
  interface ChildProcess {
    host?: string;
  }
}

interface GeneralObject {
  [key: string]: any;
}

// Declare modules for non-typed packages
declare module 'isomorphic-style-loader/StyleContext';
declare module 'react-deep-force-update';
declare module 'webpack-hot-middleware/client';
declare module 'autodll-webpack-plugin';
declare module 'terser-webpack-plugin';
declare module 'react-dev-utils/launchEditorEndpoint';
declare module 'react-dev-utils/errorOverlayMiddleware';
declare module 'react-notifications-component';
declare module 'react-error-overlay';
declare module 'react-test-renderer';
declare module 'terminate';
declare module 'isomorphic-style-loader/withStyles' {
  const _default: <T>(
    s1: string,
    s2?: string,
    s3?: string,
    s4?: string,
    s5?: string,
  ) => /* eslint no-undef:0 */
  (arg0: typeof T) => typeof T;
  export default _default;
}
declare module 'isomorphic-style-loader/useStyles' {
  const _default: (s1: any, s2?: any, s3?: any, s4?: any, s5?: any) => void;
  export default _default;
}
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.css';
declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.less';
declare module '*.md';
declare module '*.png';

declare module '!isomorphic-style-loader!*';
