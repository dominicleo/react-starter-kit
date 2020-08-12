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
declare module 'babel-loader';
declare module 'react-deep-force-update';
declare module 'webpack-hot-middleware/client';
declare module 'autodll-webpack-plugin';
declare module 'terser-webpack-plugin';
declare module 'extract-css-chunks-webpack-plugin';
declare module 'react-dev-utils/launchEditorEndpoint';
declare module 'react-dev-utils/errorOverlayMiddleware';
declare module 'react-notifications-component';
declare module 'react-error-overlay';
declare module 'react-test-renderer';
declare module 'terminate';
declare module 'less-vars-to-js';
declare module 'is-boolean-object';

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
