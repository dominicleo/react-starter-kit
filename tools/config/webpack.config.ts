import AutoDllPlugin from 'autodll-webpack-plugin';
import cssnano from 'cssnano';
import ExtractCssChunks from 'extract-css-chunks-webpack-plugin';
import fs from 'fs';
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import lessToJS from 'less-vars-to-js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import nodeExternals from 'webpack-node-externals';

import pkg from '../../package.json';
import overrideRules from '../lib/overrideRules';
import { options } from '../run';
import postcssConfig from './postcss.config';

const { debug, analyze } = options;
const verbose = !!options.verbose;

const ROOT_DIR = options.dirname;
const resolvePath = (...args: string[]) => path.resolve(ROOT_DIR, ...args);
const SRC_DIR = resolvePath('src');
const BUILD_DIR = resolvePath('build');

const REG_SCRIPT = /\.(ts|tsx|js|jsx|mjs)$/;
const REG_STYLE = /\.(css|less|styl|scss|sass|sss)$/;
const REG_IMAGE = /\.(bmp|gif|jpg|jpeg|png|svg)$/;
const REG_ANTD = /[\\/]node_modules[\\/].*(antd|antd-mobile)/;

const staticAssetName = debug ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]';

const getChunkFiles = (manifest: WebpackAssetsManifest, stats: WebpackAssetsManifest.AnyObject) => {
  const fileFilter = (file: string) => !file.endsWith('.map');
  const addPath = (file: string) => manifest.getPublicPath(file);
  const chunkFiles = stats.compilation.chunkGroups.reduce((acc: any[], c: any) => {
    acc[c.name] = [
      ...(acc[c.name] || []),
      ...c.chunks.reduce(
        (files: any[], cc: any) => [...files, ...cc.files.filter(fileFilter).map(addPath)],
        [],
      ),
    ];
    return acc;
  }, Object.create(null));
  return chunkFiles;
};

const themeVariables = lessToJS(
  fs.readFileSync(resolvePath(SRC_DIR, 'components/style/themes/default.less'), 'utf8'),
);

const css = (name: string) => {
  const isServer = name === 'server';
  return {
    test: REG_STYLE,
    exclude: [REG_ANTD],
    rules: [
      !isServer && { loader: ExtractCssChunks.loader },
      {
        exclude: SRC_DIR,
        loader: 'css-loader',
        options: {
          sourceMap: debug,
        },
      },
      {
        exclude: SRC_DIR,
        loader: 'postcss-loader',
        options: {
          plugins: [cssnano()],
        },
      },

      {
        include: SRC_DIR,
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          sourceMap: debug,
          modules: {
            localIdentName: debug ? '[name]-[local]-[hash:base64:5]' : '[hash:base64:5]',
            auto: (resourcePath: string) =>
              /\.module\.(css|less|styl|scss|sass|sss)$/.test(resourcePath),
            exportOnlyLocals: isServer,
          },
        },
      },
      {
        loader: 'postcss-loader',
        options: postcssConfig,
      },
      {
        test: /\.less$/,
        loader: 'less-loader',
        options: {
          lessOptions: {
            javascriptEnabled: true,
          },
          prependData: `@import '~@/components/style/themes/default.less';`,
        },
      },
    ].filter(Boolean),
  };
};

const config = {
  context: ROOT_DIR,

  mode: debug ? 'development' : 'production',

  cache: debug,

  output: {
    path: resolvePath(BUILD_DIR, 'public/assets'),
    publicPath: '/assets/',
    pathinfo: verbose,
    filename: debug ? 'js/[name].js' : 'js/[name].[chunkhash:8].js',
    chunkFilename: debug ? 'js/[name].chunk.js' : 'js/[name].[chunkhash:8].chunk.js',
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: (info: any) =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,

    rules: [
      // routes
      {
        test: REG_SCRIPT,
        include: [resolvePath(SRC_DIR, 'routes')],
        loader: require.resolve('./loaders/routes.ts'),
      },

      // Rules for JS / JSX
      {
        test: REG_SCRIPT,
        include: [SRC_DIR, resolvePath('tools')],
        loader: 'babel-loader',
        options: {
          // https://github.com/babel/babel-loader#options
          cacheDirectory: debug,

          // https://babeljs.io/docs/usage/options/
          babelrc: false,
          configFile: false,
          presets: [
            // A Babel preset that can automatically determine the Babel plugins and polyfills
            // https://github.com/babel/babel-preset-env
            [
              '@babel/preset-env',
              {
                targets: {
                  browsers: pkg.browserslist,
                },
                forceAllTransforms: !debug, // for UglifyJS
                modules: false,
                useBuiltIns: false,
                debug: false,
              },
            ],
            // JSX
            // https://github.com/babel/babel/tree/master/packages/babel-preset-react
            ['@babel/preset-react', { development: debug }],

            // TypeScript
            '@babel/preset-typescript',
          ],
          plugins: [
            // Experimental ECMAScript proposals
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-syntax-dynamic-import',
            // https://github.com/babel/babel/tree/main/packages/babel-plugin-proposal-nullish-coalescing-operator
            // Remove nullish coalescing operator
            '@babel/plugin-proposal-nullish-coalescing-operator',
            // https://github.com/babel/babel/tree/main/packages/babel-plugin-proposal-optional-chaining
            // Transform optional chaining operators into a series of nil checks
            '@babel/plugin-proposal-optional-chaining',
          ],
        },
      },

      {
        test: REG_STYLE,
        include: [REG_ANTD],
        rules: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: debug,
            },
          },
          {
            loader: 'postcss-loader',
            exclude: SRC_DIR,
            options: {
              plugins: [cssnano()],
            },
          },
          {
            test: /\.less$/,
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: themeVariables,
              },
            },
          },
        ],
      },

      {
        test: REG_IMAGE,
        oneOf: [
          {
            issuer: REG_STYLE,
            oneOf: [
              {
                test: /\.svg$/,
                loader: 'svg-url-loader',
                options: {
                  name: staticAssetName,
                  limit: 4096, // 4kb
                },
              },

              {
                loader: 'url-loader',
                options: {
                  name: staticAssetName,
                  limit: 4096, // 4kb
                },
              },
            ],
          },

          {
            loader: 'file-loader',
            options: {
              name: staticAssetName,
            },
          },
        ],
      },

      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },

      {
        test: /\.md$/,
        loader: resolvePath('tools/lib/markdown-loader'),
      },

      {
        exclude: [REG_SCRIPT, REG_STYLE, REG_IMAGE, /\.json$/, /\.txt$/, /\.md$/],
        loader: 'file-loader',
        options: {
          name: staticAssetName,
        },
      },

      ...(debug
        ? []
        : [
            {
              test: resolvePath('node_modules/react-deep-force-update/lib/index.js'),
              loader: 'null-loader',
            },
          ]),
    ],
  },

  plugins: [
    ...(debug
      ? []
      : [
          // https://github.com/mzgoddard/hard-source-webpack-plugin
          // Hard cache the source of modules in webpack.
          new HardSourceWebpackPlugin({
            environmentHash: {
              root: process.cwd(),
              directories: ['config'],
              files: ['package-lock.json', 'yarn.lock'],
            },
            info: {
              mode: 'none',
              level: verbose ? 'debug' : 'warn',
            },
          }),
          new HardSourceWebpackPlugin.ExcludeModulePlugin([
            {
              test: /mini-css-extract-plugin[\\/]dist[\\/]loader/,
            },
          ]),
        ]),
  ],

  resolve: {
    alias: {
      '@': SRC_DIR,
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: [SRC_DIR, resolvePath('node_modules')],
  },

  resolveLoader: {
    extensions: ['.ts', '.js', '.json'],
  },

  bail: !debug,

  stats: {
    cached: verbose,
    cachedAssets: verbose,
    chunks: verbose,
    chunkModules: verbose,
    colors: true,
    hash: verbose,
    modules: verbose,
    reasons: debug,
    timings: true,
    version: verbose,
    children: verbose,
  },

  devtool: debug ? 'cheap-module-source-map' : 'source-map',
};

const clientConfig = {
  ...config,

  name: 'client',
  target: 'web',

  entry: {
    client: ['./src/client'],
  },

  module: {
    ...config.module,
    rules: overrideRules(config.module?.rules, (rule: any) => {
      if (rule.loader === 'babel-loader') {
        const { loader, options, ...restRule } = rule;

        return {
          ...restRule,
          use: [
            'thread-loader',
            {
              loader,
              options: {
                ...options,
                plugins: [['import', { libraryName: 'antd', style: true }, 'antd']].concat(
                  rule.options.plugins,
                ),
              },
            },
          ],
        };
      }
      return rule;
    }),
  },

  plugins: [
    ...config.plugins,
    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env.BROWSER': true,
      __DEV__: debug,
    }),

    // Lightweight CSS extraction plugin
    // https://github.com/webpack-contrib/mini-css-extract-plugin
    new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: debug ? 'css/[name].css' : 'css/[name].[chunkhash:8].css',
    }),

    new ExtractCssChunks({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: debug ? 'css/chunks/[name].css' : 'css/chunks/[name].[contenthash:8].css',
      chunkFilename: debug
        ? 'css/chunks/[name].chunk.css'
        : 'css/chunks/[name].[contenthash:8].chunk.css',
      hot: debug,
    }),

    // Emit a file with assets paths
    // https://github.com/webdeveric/webpack-assets-manifest#options
    new WebpackAssetsManifest({
      output: `${BUILD_DIR}/asset-manifest.json`,
      publicPath: true,
      writeToDisk: true,
      customize: ({ key, value }: { key: string; value: string }) => {
        // You can prevent adding items to the manifest by returning false.
        if (key.toLowerCase().endsWith('.map')) return false;
        return { key, value };
      },
      done: (manifest: any, stats: any) => {
        const chunkFileName = `${BUILD_DIR}/chunk-manifest.json`;
        try {
          const chunkFiles = getChunkFiles(manifest, stats);
          fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
        } catch (err) {
          console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
          if (!debug) process.exit(1);
        }
      },
    }),

    // Webpack's DllPlugin without the boilerplate
    // https://github.com/asfktz/autodll-webpack-plugin
    new AutoDllPlugin({
      debug: verbose,
      path: 'js',
      filename: debug ? '[name].js' : '[name].[chunkhash:8].js',
      entry: {
        bundle: ['react', 'react-dom', 'universal-router', 'history'],
      },
      plugins: [
        // Emit a file with assets paths
        // https://github.com/webdeveric/webpack-assets-manifest#options
        new WebpackAssetsManifest({
          publicPath: '/assets/js/',
          customize: ({ key, value }: { key: string; value: string }) => {
            // You can prevent adding items to the manifest by returning false.
            if (key.toLowerCase().endsWith('.map')) return false;
            return { key, value };
          },
          done: (manifest: any, stats: any) => {
            const chunkFileName = `${BUILD_DIR}/bundle-manifest.json`;
            try {
              const chunkFiles = getChunkFiles(manifest, stats);
              fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
            } catch (err) {
              console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
              if (!debug) process.exit(1);
            }
          },
        }),
      ],
    }),

    ...(debug
      ? []
      : [
          // Webpack Bundle Analyzer
          // https://github.com/th0r/webpack-bundle-analyzer
          ...(analyze ? [new BundleAnalyzerPlugin()] : []),
        ]),
  ],

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
        },
      },
    },
    minimizer: !debug
      ? [
          // This plugin uses terser to minify your JavaScript.
          // https://webpack.js.org/plugins/terser-webpack-plugin/
          new TerserPlugin({
            cache: true,
            parallel: true,
            terserOptions: {
              ecma: 6,
              warnings: false,
              extractComments: false,
              compress: {
                // drop_console: true,
              },
              ie8: false,
            },
          }),

          // A Webpack plugin to optimize \ minimize CSS assets.
          // https://github.com/NMFR/optimize-css-assets-webpack-plugin
          new OptimizeCssAssetsPlugin({
            cssProcessor: cssnano,
            cssProcessorOptions: {
              safe: true,
              autoprefixer: {
                disable: true,
              },
              mergeLonghand: false,
              discardComments: {
                removeAll: true,
              },
            },
            canPrint: true,
          }),
        ]
      : [],
  },

  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
};

const serverConfig = {
  ...config,

  name: 'server',
  target: 'node',

  entry: {
    server: ['./src/server'],
  },

  output: {
    ...config.output,
    path: BUILD_DIR,
    filename: '[name].js',
    chunkFilename: 'chunks/[name].js',
    libraryTarget: 'commonjs2',
  },

  module: {
    ...config.module,

    rules: overrideRules(config.module.rules, (rule: any) => {
      // Override babel-preset-env configuration for Node.js
      if (rule.loader === 'babel-loader') {
        const { loader, options, ...restRule } = rule;
        return {
          ...restRule,
          use: [
            'thread-loader',
            {
              loader,
              options: {
                ...options,
                presets: rule.options.presets.map((preset: any) =>
                  preset[0] !== '@babel/preset-env'
                    ? preset
                    : [
                        '@babel/preset-env',
                        {
                          targets: {
                            node: 'current',
                          },
                          modules: false,
                          useBuiltIns: false,
                          debug: false,
                        },
                      ],
                ),
              },
            },
          ],
        };
      }

      // Override paths to static assets
      if (
        rule.loader === 'file-loader' ||
        rule.loader === 'url-loader' ||
        rule.loader === 'svg-url-loader'
      ) {
        return {
          ...rule,
          options: {
            ...rule.options,
            emitFile: false,
          },
        };
      }

      return rule;
    }),
  },

  externals: [
    './bundle-manifest.json',
    './chunk-manifest.json',
    nodeExternals({
      whitelist: [REG_STYLE, REG_IMAGE],
    }),
  ],

  plugins: [
    ...config.plugins,
    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env.BROWSER': false,
      __DEV__: debug,
    }),

    // Adds a banner to the top of each generated chunk
    // https://webpack.js.org/plugins/banner-plugin/
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],

  // Do not replace node globals with polyfills
  // https://webpack.js.org/configuration/node/
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
  },
};

clientConfig.module.rules.push(css('client'));
serverConfig.module.rules.push(css('server'));

const REG_ANTD_STYLE = /antd\/.*?\/style.*?/;
const origExternals = [...serverConfig.externals];

serverConfig.externals = [
  (context: any, request: any, callback: any) => {
    if (request.match(REG_ANTD_STYLE)) return callback();
    if (typeof origExternals[0] === 'function') {
      origExternals[0](context, request, callback);
    } else {
      callback();
    }
  },
  ...(typeof origExternals[0] === 'function' ? [] : origExternals),
];

serverConfig.module.rules.unshift({
  test: REG_ANTD_STYLE,
  use: 'null-loader',
});

export default [clientConfig, serverConfig];
