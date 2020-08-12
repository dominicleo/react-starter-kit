import path from 'path';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import LRU from 'lru-cache';
import React from 'react';
import ReactDOM from 'react-dom/server';
import PrettyError from 'pretty-error';
import { AppContextTypes } from '@/components/shared/app/context';
import App from '@/components/shared/app';
import Html from '@/components/shared/html';
import ErrorPage from '@/pages/error';
import router from './router';
// @ts-ignore
import bundle from './bundle-manifest.json';
// @ts-ignore
import chunks from './chunk-manifest.json';
import config from './config';

const assets = Object.assign(chunks, bundle);

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // send entire app down. Process manager will restart it
  process.exit(1);
});

global.navigator = global.navigator || {};
// @ts-ignore
global.navigator.userAgent = global.navigator.userAgent || 'all';

const app = express();

app.set('trust proxy', config.trustProxy);
app.set('x-powered-by', false);

// Register Node.js middleware
app.use(express.static(path.resolve(__dirname, 'public'), { maxAge: 1000 * 60 * 60 }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60,
});

if (!__DEV__) {
  app.use((request, response, next) => {
    const cacheKey = request.url;
    const target = cache.get(cacheKey);
    if (target) {
      response.send(target);
    } else {
      next();
    }
  });
}

app.get('*', async (request, response, next) => {
  try {
    const context: AppContextTypes = {
      pathname: request.path,
      query: request.query,
    };

    const route = await router.resolve(context);

    context.params = route.params;

    if (route.redirect) {
      response.redirect(route.status || 302, route.redirect);
      return;
    }

    const data = { ...route };
    const rootComponent = <App context={context}>{route.component}</App>;

    data.children = await ReactDOM.renderToString(rootComponent);

    const stylesheets = new Set();
    const scripts = new Set();

    const addChunk = (chunk: string) => {
      if (assets[chunk]) {
        assets[chunk].forEach((asset: any) => {
          /\.css$/i.test(asset) && stylesheets.add(asset);
          /\.js$/i.test(asset) && scripts.add(asset);
        });
      } else if (__DEV__) {
        throw new Error(`Chunk with name '${chunk}' cannot be found`);
      }
    };

    addChunk('bundle');
    addChunk('client');
    if (route.chunk) addChunk(route.chunk);
    if (route.chunks) route.chunks.forEach(addChunk);

    data.stylesheets = Array.from(stylesheets);
    data.scripts = Array.from(scripts);
    data.app = {};

    const html = ReactDOM.renderToStaticMarkup(<Html {...data} />);
    const document = `<!doctype html>${html}`;
    !__DEV__ && cache.set(request.url, document);
    response.status(route.status || 200);
    response.send(document);
  } catch (error) {
    next(error);
  }
});

// Error handling
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

app.use((error: any, request: Request, response: Response, _next: NextFunction) => {
  console.error(pe.render(error));
  const html = ReactDOM.renderToStaticMarkup(
    <Html app={{}} title="Internal Server Error" description={error.message}>
      {ReactDOM.renderToString(<ErrorPage error={error} />)}
    </Html>,
  );
  response.status(error.status || 500);
  response.send(`<!doctype html>${html}`);
});

if (!module.hot) {
  app.listen(config.port, () => {
    console.info(`The server is running at http://localhost:${config.port}/`);
  });
}

if (module.hot) {
  module.hot.accept('./router');
}

export const { hot } = module;
export default app;
