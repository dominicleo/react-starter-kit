import React from 'react';
import ReactDOM from 'react-dom';
import deepForceUpdate from 'react-deep-force-update';
import queryString from 'query-string';
import { Location } from 'history';
import App from '@/components/shared/app';
import history from '@/utils/history';
import { updateMeta } from '@/utils/DOMUtils';
import router from '@/router';
import { AppContextTypes } from '@/context';

const insertCss = (...styles: any[]) => {
  const removeCss = styles.map((x: any) => x._insertCss());
  return () => {
    removeCss.forEach((f: any) => f());
  };
};

const context: AppContextTypes = { pathname: '' };

const container = document.getElementById('app');
let currentLocation = history.location;
let appInstance: typeof App | void;

const scrollPositionsHistory: {
  [key: string]: { scrollX: number; scrollY: number };
} = {};

// Re-render the app when window.location changes
async function onLocationChange(location: Location, action?: any) {
  // Remember the latest scroll position for the previous location
  scrollPositionsHistory[currentLocation.key || ''] = {
    scrollX: window.pageXOffset,
    scrollY: window.pageYOffset,
  };
  // Delete stored scroll position for next page if any
  if (action === 'PUSH') {
    delete scrollPositionsHistory[location.key || ''];
  }
  currentLocation = location;

  const isInitialRender = !action;
  try {
    context.pathname = location.pathname;
    context.query = queryString.parse(location.search);

    const route = await router.resolve(context);

    context.params = route.params;

    // Prevent multiple page renders during the routing process
    if (currentLocation.key !== location.key) {
      return;
    }

    if (route.redirect) {
      history.replace(route.redirect);
      return;
    }

    const renderReactApp = isInitialRender ? ReactDOM.hydrate : ReactDOM.render;
    appInstance = renderReactApp(
      <App context={context} insertCss={insertCss}>
        {route.component}
      </App>,
      container,
      () => {
        if (isInitialRender) {
          // Switch off the native scroll restoration behavior and handle it manually
          // https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration
          if (window.history && 'scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
          }

          const elem = document.getElementById('css');
          if (elem) elem.parentNode?.removeChild(elem);
          return;
        }

        document.title = route.title;

        updateMeta('description', route.description);
        // Update necessary tags in <head> at runtime here, ie:
        // updateMeta('keywords', route.keywords);

        let scrollX = 0;
        let scrollY = 0;
        const pos = scrollPositionsHistory[location.key || ''];
        if (pos) {
          scrollX = pos.scrollX;
          scrollY = pos.scrollY;
        } else {
          const targetHash = location.hash.substr(1);
          if (targetHash) {
            const target = document.getElementById(targetHash);
            if (target) {
              scrollY = window.pageYOffset + target.getBoundingClientRect().top;
            }
          }
        }

        window.scrollTo(scrollX, scrollY);
      },
    );
  } catch (error) {
    if (__DEV__) {
      throw error;
    }

    console.error(error);

    if (!isInitialRender && currentLocation.key === location.key) {
      console.error('RSK will reload your page after error');
      window.location.reload();
    }
  }
}

history.listen(onLocationChange);
onLocationChange(currentLocation);

// Enable Hot Module Replacement (HMR)
if (module.hot) {
  module.hot.accept('./router', () => {
    // @ts-ignore
    if (appInstance && appInstance.updater.isMounted(appInstance)) {
      // Force-update the whole tree, including components that refuse to update
      deepForceUpdate(appInstance);
    }

    onLocationChange(currentLocation);
  });
}
