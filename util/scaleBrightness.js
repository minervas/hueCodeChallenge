/* eslint no-console: 'off' */

const _ = require('lodash');

const maxBrightness = 254;

module.exports = {
  // is this an okay method of rounding?
  scaleBrightness: bri => _.round((bri / maxBrightness) * 100),
};
