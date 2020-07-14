/* eslint-disable max-len */

if (process.env.BROWSER) {
  throw new Error(
    'Do not import `config.js` from inside the client-side code.',
  );
}

export default {
  port: process.env.PORT || 3000,
  trustProxy: process.env.TRUST_PROXY || 'loopback',
};
