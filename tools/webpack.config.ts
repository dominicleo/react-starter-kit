import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import nodeExternals from 'webpack-node-externals';
import cssnano from 'cssnano';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import overrideRules from './lib/overrideRules';
import pkg from '../package.json';
import postcssConfig from './postcss.config';
import { options } from './run';

const ROOT_DIR = path.resolve(__dirname, '..');
const resolvePath = (...args: string[]) => path.resolve(ROOT_DIR, ...args);
const SRC_DIR = resolvePath('src');
const BUILD_DIR = resolvePath('build');

const isDebug = !process.argv.includes('--release');
const isVerbose = process.argv.includes('--verbose');
const isAnalyze =
  process.argv.includes('--analyze') || process.argv.includes('--analyse');

const reScript = /\.(ts|tsx|js|jsx|mjs)$/;
const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;

const staticAssetName = isDebug
  ? '[path][name].[ext]?[hash:8]'
  : '[hash:8].[ext]';

//
// Common configuration chunk to be used for both
// client-side (client.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

const config = {
  context: ROOT_DIR,

  mode: isDebug ? 'development' : 'production',

  output: {
    path: resolvePath(BUILD_DIR, 'public/assets'),
    publicPath: '/assets/',
    pathinfo: isVerbose,
    filename: isDebug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: isDebug
      ? '[name].chunk.js'
      : '[name].[chunkhash:8].chunk.js',
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
        test: reScript,
        include: [SRC_DIR, resolvePath('tools')],
        loader: 'babel-loader',
        options: {
          // https://github.com/babel/babel-loader#options
          cacheDirectory: isDebug,

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
                forceAllTransforms: !isDebug, // for UglifyJS
                modules: false,
                useBuiltIns: false,
                debug: false,
              },
            ],
            // JSX
            // https://github.com/babel/babel/tree/master/packages/babel-preset-react
            ['@babel/preset-react', { development: isDebug }],

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

      // Rules for Style Sheets
      {
        test: reStyle,
        rules: [
          // Convert CSS into JS module
          {
            issuer: { not: [reStyle] },
            use: 'isomorphic-style-loader',
          },

          // Process external/third-party styles
          {
            exclude: SRC_DIR,
            loader: 'css-loader',
            options: {
              sourceMap: isDebug,
            },
          },
          {
            exclude: SRC_DIR,
            loader: 'postcss-loader',
            options: {
              plugins: [
                // CSS Nano options http://cssnano.co/
                cssnano(),
                // TODO: cssnano doesn't support comment discarding. Do it in somewhere else.
              ],
            },
          },

          // Process internal/project styles (from src folder)
          {
            include: SRC_DIR,
            loader: 'css-loader',
            options: {
              // CSS Loader https://github.com/webpack/css-loader
              importLoaders: 1,
              sourceMap: isDebug,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: {
                localIdentName: isDebug
                  ? '[name]-[local]-[hash:base64:5]'
                  : '[hash:base64:5]',
              },
            },
          },

          // Apply PostCSS plugins including autoprefixer
          {
            loader: 'postcss-loader',
            options: postcssConfig,
          },

          // Compile Less to CSS
          // https://github.com/webpack-contrib/less-loader
          // Install dependencies before uncommenting: yarn add --dev less-loader less
          // {
          //   test: /\.less$/,
          //   loader: 'less-loader',
          // },

          // Compile Sass to CSS
          // https://github.com/webpack-contrib/sass-loader
          // Install dependencies before uncommenting: yarn add --dev sass-loader node-sass
          // {
          //   test: /\.(scss|sass)$/,
          //   loader: 'sass-loader',
          // },
        ],
      },

      // Rules for images
      {
        test: reImage,
        oneOf: [
          // Inline lightweight images into CSS
          {
            issuer: reStyle,
            oneOf: [
              // Inline lightweight SVGs as UTF-8 encoded DataUrl string
              {
                test: /\.svg$/,
                loader: 'svg-url-loader',
                options: {
                  name: staticAssetName,
                  limit: 4096, // 4kb
                },
              },

              // Inline lightweight images as Base64 encoded DataUrl string
              {
                loader: 'url-loader',
                options: {
                  name: staticAssetName,
                  limit: 4096, // 4kb
                },
              },
            ],
          },

          // Or return public URL to image resource
          {
            loader: 'file-loader',
            options: {
              name: staticAssetName,
            },
          },
        ],
      },

      // Convert plain text into JS module
      {
        test: /\.txt$/,
        loader: 'raw-loader',
      },

      // Convert Markdown into HTML
      {
        test: /\.md$/,
        loader: path.resolve(__dirname, './lib/markdown-loader'),
      },

      // Return public URL for all assets unless explicitly excluded
      // DO NOT FORGET to update `exclude` list when you adding a new loader
      {
        exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
        loader: 'file-loader',
        options: {
          name: staticAssetName,
        },
      },

      // Exclude dev modules from production build
      ...(isDebug
        ? []
        : [
            {
              test: resolvePath(
                'node_modules/react-deep-force-update/lib/index.js',
              ),
              loader: 'null-loader',
            },
          ]),
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  resolveLoader: {
    extensions: ['.ts', '.js', '.json'],
  },

  // Don't attempt to continue if there are any errors.
  bail: !isDebug,

  cache: isDebug,

  // Specify what bundle information gets displayed
  // https://webpack.js.org/configuration/stats/
  stats: {
    cached: isVerbose,
    cachedAssets: isVerbose,
    chunks: isVerbose,
    chunkModules: isVerbose,
    colors: true,
    hash: isVerbose,
    modules: isVerbose,
    reasons: isDebug,
    timings: true,
    version: isVerbose,
  },

  // Choose a developer tool to enhance debugging
  // https://webpack.js.org/configuration/devtool/#devtool
  devtool: isDebug ? 'cheap-module-inline-source-map' : 'source-map',
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
            plugins: [
              ['import', { libraryName: 'antd', style: true }, 'antd'],
            ].concat(rule.options.plugins),
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
      __DEV__: isDebug,
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
          const chunkFiles = stats.compilation.chunkGroups.reduce(
            (acc: any[], c: any) => {
              acc[c.name] = [
                ...(acc[c.name] || []),
                ...c.chunks.reduce(
                  (files: any[], cc: any) => [
                    ...files,
                    ...cc.files.filter(fileFilter).map(addPath),
                  ],
                  [],
                ),
              ];
              return acc;
            },
            Object.create(null),
          );
          fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
        } catch (err) {
          console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
          if (!isDebug) process.exit(1);
        }
      },
    }),

    ...(isDebug
      ? []
      : [
          // Webpack Bundle Analyzer
          // https://github.com/th0r/webpack-bundle-analyzer
          ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
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
      whitelist: [reStyle, reImage],
    }),
  ],

  plugins: [
    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env.BROWSER': false,
      __DEV__: isDebug,
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
