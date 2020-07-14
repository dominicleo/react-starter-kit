import path from 'path';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import React from 'react';
import ReactDOM from 'react-dom/server';
import PrettyError from 'pretty-error';
import { AppContextTypes } from '@/context';
import App from '@/components/shared/app';
import Html from '@/components/shared/html';
import { ErrorPageWithoutStyle } from '@/pages/error/ErrorPage';
import errorPageStyle from '@/pages/error/ErrorPage.css';
import router from './router';
// @ts-ignore
import chunks from './chunk-manifest.json';
import config from './config';

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // send entire app down. Process manager will restart it
  process.exit(1);
});

//
// Tell any CSS tooling (such as Material UI) to use all vendor prefixes if the
// user agent is not known.
// -----------------------------------------------------------------------------
// @ts-ignore
global.navigator = global.navigator || {};
// @ts-ignore
global.navigator.userAgent = global.navigator.userAgent || 'all';

const app = express();

app.set('trust proxy', config.trustProxy);
app.set('x-powered-by', false);

// Register Node.js middleware
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Register server-side rendering middleware
app.get('*', async (req, res, next) => {
  try {
    const css = new Set();

    // Enables critical path CSS rendering
    // https://github.com/kriasoft/isomorphic-style-loader
    const insertCss = (...styles: any[]) => {
      // eslint-disable-next-line no-underscore-dangle
      styles.forEach(style => css.add(style._getCss()));
    };

    // Global (context) variables that can be easily accessed from any React component
    // https://facebook.github.io/react/docs/context.html
    const context: AppContextTypes = {
      // The twins below are wild, be careful!
      pathname: req.path,
      query: req.query,
    };

    const route = await router.resolve(context);

    context.params = route.params;

    if (route.redirect) {
      res.redirect(route.status || 302, route.redirect);
      return;
    }

    const data = { ...route };
    const rootComponent = (
      <App context={context} insertCss={insertCss}>
        {route.component}
      </App>
    );

    data.children = await ReactDOM.renderToString(rootComponent);
    data.styles = [{ id: 'css', cssText: [...css].join('') }];

    const scripts = new Set();
    const addChunk = (chunk: string) => {
      if (chunks[chunk]) {
        chunks[chunk].forEach((asset: any) => scripts.add(asset));
      } else if (__DEV__) {
        throw new Error(`Chunk with name '${chunk}' cannot be found`);
      }
    };
    addChunk('client');
    if (route.chunk) addChunk(route.chunk);
    if (route.chunks) route.chunks.forEach(addChunk);

    data.scripts = Array.from(scripts);
    data.app = {};

    const html = ReactDOM.renderToStaticMarkup(<Html {...data} />);
    res.status(route.status || 200);
    res.send(`<!doctype html>${html}`);
  } catch (err) {
    next(err);
  }
});

// Error handling
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(pe.render(err));
  const html = ReactDOM.renderToStaticMarkup(
    <Html
      app={{}}
      title="Internal Server Error"
      description={err.message}
      styles={[{ id: 'css', cssText: errorPageStyle._getCss() }]}
    >
      {ReactDOM.renderToString(<ErrorPageWithoutStyle error={err} />)}
    </Html>,
  );
  res.status(err.status || 500);
  res.send(`<!doctype html>${html}`);
});

// Launch the server
if (!module.hot) {
  app.listen(config.port, () => {
    console.info(`The server is running at http://localhost:${config.port}/`);
  });
}

// Hot Module Replacement
if (module.hot) {
  module.hot.accept('./router');
}

export const { hot } = module;
export default app;
