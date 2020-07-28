import webpack from 'webpack';

export default function runWebpack(config: any, statsInfo: webpack.Options.Stats) {
  return new Promise((resolve, reject) => {
    webpack(config).run((error, stats) => {
      if (error) {
        return reject(error);
      }

      console.info(stats.toString(statsInfo));
      if (stats.hasErrors()) {
        return reject(new Error('Webpack compilation errors'));
      }

      return resolve();
    });
  });
}
