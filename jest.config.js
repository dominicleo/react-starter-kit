module.exports = {
  automock: false,
  browser: false,
  bail: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  globals: {
    __DEV__: true,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|less|styl|scss|sass|sss)$': 'identity-obj-proxy',
  },
  transform: {
    '\\.(ts|tsx|js|jsx)$': 'babel-jest',
    '^(?!.*\\.(js|jsx|json|css|less|styl|scss|sass|sss)$)':
      '<rootDir>/tools/lib/fileTransformer.js',
  },
  verbose: true,
};
