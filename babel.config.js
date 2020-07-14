module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-react',
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
  ignore: ['node_modules', 'build'],
};
