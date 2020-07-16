import path from 'path';
import express, { Request, Response, Application } from 'express';
import browserSync from 'browser-sync';
import detect from 'detect-port';
import webpack, { Compiler, Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import webpackConfig from './config/webpack.config';
import run, { options } from './run';
import clean from './clean';
import logger from './lib/logger';

const { debug } = options;

// https://webpack.js.org/configuration/watch/#watchoptions
const watchOptions = {};

function createCompilationPromise(name: string, compiler: Compiler) {
  return new Promise((resolve, reject) => {
    compiler.hooks.done.tap(name, stats => {
      if (stats.hasErrors()) {
        reject(new Error(`${name} Compilation failed!\n${stats.toString({ colors: true })}`));
      } else {
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
  const clientPromise = createCompilationPromise('client', clientCompiler);
  const serverPromise = createCompilationPromise('server', serverCompiler);

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
    appPromise = new Promise(resolve => (appPromiseResolve = resolve));
  });

  server.use((req: Request, res: Response) => {
    appPromise.then(() => app.handle(req, res)).catch(error => console.error(error));
  });

  function checkForUpdate() {
    if (!hot) {
      throw new Error(`Hot Module Replacement is disabled.`);
    }
    if (hot.status() !== 'idle') {
      return Promise.resolve();
    }
    return hot
      .check(true)
      .then((updatedModules: string[]) => {
        if (!updatedModules) {
          return;
        }
        if (updatedModules.length !== 0) {
          checkForUpdate();
        }
      })
      .catch(() => {
        if (['abort', 'fail'].includes(hot.status())) {
          reloadApp();
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

  await clientPromise;
  await serverPromise;

  reloadApp();
  appPromiseIsResolved = true;
  appPromiseResolve!();

  logger.wait('Launching server...');

  const port: number = await new Promise((resolve, reject) => {
    detect(options.port, (error, port) => {
      if (error) {
        reject(error);
      }
      if (options.port !== port) {
        console.warn(` 端口: ${options.port} 被占用，系统已分配另一个可用端口：${port}`);
      }
      resolve(port);
    });
  });

  // Launch the development server with Browsersync and HMR
  await new Promise((resolve, reject) =>
    browserSync.create().init(
      {
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

  return server;
}

export default start;
