import path from 'path';
import express, { Request, Response, Application } from 'express';
import browserSync from 'browser-sync';
import webpack, { Compiler, Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import webpackConfig from './webpack.config';
import run, { format, options } from './run';
import clean from './clean';

const debug = !options.release;

// https://webpack.js.org/configuration/watch/#watchoptions
const watchOptions = {};

function createCompilationPromise(name: string, compiler: Compiler, config: Configuration) {
  return new Promise((resolve, reject) => {
    let timeStart = new Date();
    compiler.hooks.compile.tap(name, () => {
      timeStart = new Date();
      console.info(`[${format(timeStart)}] Compiling '${name}'...`);
    });

    compiler.hooks.done.tap(name, stats => {
      console.info(stats.toString(config.stats));
      const timeEnd = new Date();
      const time = timeEnd.getTime() - timeStart.getTime();
      if (stats.hasErrors()) {
        console.info(`[${format(timeEnd)}] Failed to compile '${name}' after ${time} ms`);
        reject(new Error('Compilation failed!'));
      } else {
        console.info(`[${format(timeEnd)}] Finished '${name}' compilation after ${time} ms`);
        resolve(stats);
      }
    });
  });
}

const getWebpackConfig = (name: string) => {
  const config = webpackConfig.find(configure => configure.name === name) as any;
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.module.rules = config.module.rules.filter(({ loader }: any) => loader !== 'null-loader');

  if (name === 'client') {
    config.entry.client = ['./tools/lib/webpackHotDevClient'].concat(config.entry.client);
    ['filename', 'chunkFilename'].forEach((key: string) => {
      config.output[key] = config.output[key].replace('chunkhash', 'hash');
    });
  }

  if (name === 'server') {
    config.output.hotUpdateMainFilename = 'updates/[hash].hot-update.json';
    config.output.hotUpdateChunkFilename = 'updates/[id].[hash].hot-update.js';
  }

  return config;
};

let server: Application;

async function start() {
  if (server) return server;
  server = express();
  server.set('x-powered-by', false);
  server.use(errorOverlayMiddleware());
  server.use(express.static(path.resolve(__dirname, '../public')));

  const clientConfig = getWebpackConfig('client');
  const serverConfig = getWebpackConfig('server');

  // Configure compilation
  await run(clean);
  const multiCompiler = webpack([clientConfig, serverConfig] as Configuration[]);
  const clientCompiler = multiCompiler.compilers.find(({ name }) => name === 'client')!;
  const serverCompiler = multiCompiler.compilers.find(({ name }) => name === 'server')!;
  const clientPromise = createCompilationPromise('client', clientCompiler, clientConfig);
  const serverPromise = createCompilationPromise('server', serverCompiler, serverConfig);

  // https://github.com/webpack/webpack-dev-middleware
  server.use(
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      logLevel: 'silent',
      watchOptions,
    }),
  );

  // https://github.com/glenjamin/webpack-hot-middleware
  server.use(webpackHotMiddleware(clientCompiler, { log: false }));

  let app: Application;
  let hot: any;
  function reloadApp() {
    delete require.cache[require.resolve('../build/server')];
    // eslint-disable-next-line global-require
    const compiled = require('../build/server');
    app = compiled.default;
    hot = compiled.hot;
  }

  let appPromise: Promise<void>;
  let appPromiseResolve: Function;
  let appPromiseIsResolved = true;
  serverCompiler.hooks.compile.tap('server', () => {
    if (!appPromiseIsResolved) return;
    appPromiseIsResolved = false;
    // eslint-disable-next-line no-return-assign
    appPromise = new Promise(resolve => (appPromiseResolve = resolve));
  });

  server.use((req: Request, res: Response) => {
    appPromise.then(() => app.handle(req, res)).catch(error => console.error(error));
  });

  function checkForUpdate(fromUpdate?: boolean) {
    const hmrPrefix = '[\x1b[35mHMR\x1b[0m] ';
    if (!hot) {
      throw new Error(`${hmrPrefix}Hot Module Replacement is disabled.`);
    }
    if (hot.status() !== 'idle') {
      return Promise.resolve();
    }
    return hot
      .check(true)
      .then((updatedModules: string[]) => {
        if (!updatedModules) {
          if (fromUpdate) {
            console.info(`${hmrPrefix}Update applied.`);
          }
          return;
        }
        if (updatedModules.length === 0) {
          console.info(`${hmrPrefix}Nothing hot updated.`);
        } else {
          console.info(`${hmrPrefix}Updated modules:`);
          updatedModules.forEach(moduleId => console.info(`${hmrPrefix} - ${moduleId}`));
          checkForUpdate(true);
        }
      })
      .catch((error: Error) => {
        if (['abort', 'fail'].includes(hot.status())) {
          console.warn(`${hmrPrefix}Cannot apply update.`);
          reloadApp();
          console.warn(`${hmrPrefix}App has been reloaded.`);
        } else {
          console.warn(`${hmrPrefix}Update failed: ${error.stack || error.message}`);
        }
      });
  }

  serverCompiler.watch(watchOptions, (error, stats) => {
    if (app && !error && !stats.hasErrors()) {
      checkForUpdate().then(() => {
        appPromiseIsResolved = true;
        appPromiseResolve();
      });
    }
  });

  // Wait until both client-side and server-side bundles are ready
  await clientPromise;
  await serverPromise;

  const timeStart = new Date();
  console.info(`[${format(timeStart)}] Launching server...`);

  // Load compiled src/server.js as a middleware
  reloadApp();
  appPromiseIsResolved = true;
  appPromiseResolve!();

  const port = options.port ? Number(options.port) : undefined;

  // Launch the development server with Browsersync and HMR
  await new Promise((resolve, reject) =>
    browserSync.create().init(
      {
        // https://www.browsersync.io/docs/options
        server: { baseDir: '../public' },
        middleware: [server],
        open: options.silent ? false : 'local',
        notify: false,
        ...(debug ? {} : { ui: {} }),
        ...(port ? { port } : null),
      },
      (error, bs) => (error ? reject(error) : resolve(bs)),
    ),
  );

  const timeEnd = new Date();
  const time = timeEnd.getTime() - timeStart.getTime();
  console.info(`[${format(timeEnd)}] Server launched after ${time} ms`);
  return server;
}

export default start;
