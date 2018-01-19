/* eslint no-console: 'off' */

const Promise = require('bluebird');

module.exports = {
  sleep: sleepTime => new Promise((resolve) => {
    setTimeout(() => resolve('timeout complete'), sleepTime);
  }),
};
