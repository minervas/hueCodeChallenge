/* eslint no-console: 'off' */

const config = require('config');

module.exports = {
  setEnv: () => {
    const keys = Object.keys(config);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const val = config[key];
      if (process.env[keys]) {
        console.log(`env var found, starting with ${key}=${val}`);
      } else {
        process.env[key] = val;
        console.log(`starting with ${key}=${val}`);
      }
    }
    return 'env set';
  },
};
