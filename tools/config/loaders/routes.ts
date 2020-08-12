import babelLoader from 'babel-loader';

const RoutePlugin = ({ types }: any) => {
  return {
    name: 'transform-routes',
    visitor: {
      Identifier(path: any) {
        if (
          path.isIdentifier({ name: 'component' }) &&
          path.parent.value?.type === 'StringLiteral'
        ) {
          const webpackChunkName = path.parent.value.extra.rawValue
            .replace(/^@\//, '')
            .replace(/\//g, '-');
          path.parent.value.extra.raw = `() => import(/* webpackChunkName: '${webpackChunkName}' */ '${path.parent.value.extra.rawValue}')`;

          path.parentPath.container.push(
            types.objectProperty(types.Identifier('chunk'), types.StringLiteral(webpackChunkName)),
          );
        }
      },
    },
  };
};

export default babelLoader.custom(() => ({
  config: (config: any) => ({
    ...config.options,
    plugins: [RoutePlugin],
  }),
  result: (result: any) => {
    console.log(result.code);
    return result;
  },
}));
