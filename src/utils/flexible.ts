// @ts-ignore

interface Flexible {
  rem?: number;
  dpr?: number;
  refresh?: () => void;
  rem2px?: (data: number) => number | string;
  px2rem?: (data: number) => number | string;
}

((global, library) => {
  const document = global.document;
  const documentElement = document.documentElement;
  let viewportElement = document.querySelector('meta[name="viewport"]');
  const viewportElementContentProps = viewportElement?.getAttribute('content');
  const flexibleElement = document.querySelector('meta[name="flexible"]');
  const flexibleElementContentProps = flexibleElement?.getAttribute('content');
  const flexibleInX5Element = document.querySelector('meta[name="flexible-in-x5"]');
  const flexible: Flexible = library || (library = {});

  let flexibleInX5 = true;
  let dpr = 0;
  let scale = 0;
  let timer: any;

  if (viewportElementContentProps) {
    process.env.NODE_ENV === 'development' && console.warn('将根据已有的 meta 标签来设置缩放比例');
    const match = viewportElementContentProps.match(/initial-scale=([\d.]+)/);
    if (match) {
      scale = parseFloat(match[1]);
      dpr = parseInt((1 / scale).toFixed(0));
    }
  } else if (flexibleElementContentProps) {
    const initialDpr = flexibleElementContentProps.match(/initial-dpr=([\d.]+)/);
    const maximumDpr = flexibleElementContentProps.match(/maximum-dpr=([\d.]+)/);
    if (initialDpr) {
      dpr = parseFloat(initialDpr[1]);
      scale = parseFloat((1 / dpr).toFixed(2));
    }
    if (maximumDpr) {
      dpr = parseFloat(maximumDpr[1]);
      scale = parseFloat((1 / dpr).toFixed(2));
    }
  }

  if (flexibleInX5Element) {
    flexibleInX5 = flexibleInX5Element.getAttribute('content') !== 'false';
  }

  if (!dpr && !scale) {
    const { navigator, devicePixelRatio, localStorage } = global;
    const isChrome = global.chrome;
    const isIPhone = /iphone/gi.test(navigator.appVersion);
    // const isAndroid = /android/gi.test(navigator.appVersion);
    const isX5 = /TBS\/\d+/.test(navigator.userAgent);
    let isInWhiteList = false;

    try {
      isInWhiteList = localStorage.getItem('IN_FLEXIBLE_WHITE_LIST') === 'true';
    } catch {
      isInWhiteList = false;
    }

    if (isIPhone || isChrome || (isX5 && flexibleInX5 && isInWhiteList)) {
      if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
        dpr = 3;
      } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
        dpr = 2;
      } else {
        dpr = 1;
      }
    } else {
      dpr = 1;
    }
    scale = 1 / dpr;
  }

  documentElement.setAttribute('data-dpr', String(dpr));

  if (!viewportElement) {
    viewportElement = document.createElement('meta');
    viewportElement.setAttribute('name', 'viewport');
    viewportElement.setAttribute(
      'content',
      `initial-scale=${scale},maximum-scale=${scale},minimum-scale=${scale},user-scalable=no`,
    );

    if (documentElement.firstElementChild) {
      documentElement.firstElementChild.appendChild(viewportElement);
    } else {
      const wrapper = document.createElement('div');
      wrapper.appendChild(viewportElement);
      document.write(wrapper.innerHTML);
    }
  }

  function refresh() {
    const { width } = documentElement.getBoundingClientRect();
    const rem = width / 10;
    documentElement.style.fontSize = rem + 'px';
    flexible.rem = rem;
  }

  global.addEventListener(
    'resize',
    () => {
      timer && clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    },
    false,
  );

  global.addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted) {
        timer && clearTimeout(timer);
        timer = setTimeout(refresh, 300);
      }
    },
    false,
  );

  if (document.readyState === 'complete') {
    document.body.style.fontSize = 12 * dpr + 'px';
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        document.body.style.fontSize = 12 * dpr + 'px';
      },
      false,
    );
  }

  refresh();

  flexible.dpr = dpr;
  flexible.refresh = refresh;
  flexible.rem2px = function (data) {
    if (!this.rem) return data;
    if (typeof data === 'string' && /rem$/.test(data)) {
      return parseFloat(data) * this.rem + 'px';
    }
    return data * this.rem;
  };

  flexible.px2rem = function (data) {
    if (!this.rem) return data;
    if (typeof data === 'string' && /px$/.test(data)) {
      return parseFloat(data) * this.rem + 'rem';
    }
    return data * this.rem;
  };

  library = flexible;
})(window, window.flexible || (window.flexible = {}));
