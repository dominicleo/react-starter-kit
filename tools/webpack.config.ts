import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import nodeExternals from 'webpack-node-externals';
import cssnano from 'cssnano';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
// import AutoDllPlugin from 'autodll-webpack-plugin';
import overrideRules from './lib/overrideRules';
import pkg from '../package.json';
import postcssConfig from './postcss.config';
import { options } from './run';

const ROOT_DIR = path.resolve(__dirname, '..');
const resolvePath = (...args: string[]) => path.resolve(ROOT_DIR, ...args);
const SRC_DIR = resolvePath('src');
const BUILD_DIR = resolvePath('build');

const debug = !options.release;
const { verbose, analyze } = options;

const REG_SCRIPT = /\.(ts|tsx|js|jsx|mjs)$/;
const REG_STYLE = /\.(css|less|styl|scss|sass|sss)$/;
const REG_IMAGE = /\.(bmp|gif|jpg|jpeg|png|svg)$/;
const REG_ANTD = /[\\/]node_modules[\\/].*(antd|antd-mobile)/;

const staticAssetName = debug ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]';

// Common configuration chunk to be used for both
// client-side (client.js) and server-side (server.js) bundles

const config = {
  context: ROOT_DIR,

  mode: debug ? 'development' : 'production',

  output: {
    path: resolvePath(BUILD_DIR, 'public/assets'),
    publicPath: '/assets/',
    pathinfo: verbose,
    filename: debug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: debug ? '[name].chunk.js' : '[name].[chunkhash:8].chunk.js',
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: (info: any) =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,

    rules: [
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
            exclude: SRC_DIR,
            loader: 'postcss-loader',
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
              },
            },
          },
        ],
      },

      {
        test: REG_STYLE,
        exclude: [REG_ANTD],
        rules: [
          {
            issuer: { not: [REG_STYLE] },
            use: 'isomorphic-style-loader',
          },

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
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: postcssConfig,
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
        loader: path.resolve(__dirname, './lib/markdown-loader'),
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

  resolve: {
    alias: {
      '@': SRC_DIR,
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },

  resolveLoader: {
    extensions: ['.ts', '.js', '.json'],
  },

  bail: !debug,

  cache: debug,

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
  },

  devtool: debug ? 'cheap-module-inline-source-map' : 'source-map',
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
        return {
          ...rule,
          options: {
            ...rule.options,
            plugins: [['import', { libraryName: 'antd', style: true }, 'antd']].concat(
              rule.options.plugins,
            ),
          },
        };
      }
      return rule;
    }),
  },

  plugins: [
    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env.BROWSER': true,
      __DEV__: debug,
    }),

    // Lightweight CSS extraction plugin
    // https://github.com/webpack-contrib/mini-css-extract-plugin
    new MiniCssExtractPlugin({
      filename: debug ? 'css/[name].css' : 'css/[name].[chunkhash:8].css',
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
        // Write chunk-manifest.json.json
        const chunkFileName = `${BUILD_DIR}/chunk-manifest.json`;
        try {
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
          fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
        } catch (err) {
          console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
          if (!debug) process.exit(1);
        }
      },
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
        return {
          ...rule,
          options: {
            ...rule.options,
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
    './chunk-manifest.json',
    './asset-manifest.json',
    nodeExternals({
      whitelist: [REG_STYLE, REG_IMAGE],
    }),
  ],

  plugins: [
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

export default [clientConfig, serverConfig];
