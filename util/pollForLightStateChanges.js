/* eslint no-console: 'off', no-param-reassign: 'off' */
const _ = require('lodash');
const rp = require('request-promise');
const Promise = require('bluebird');

const { sleep } = require('./sleep.js');
const { scaleBrightness } = require('./scaleBrightness.js');

const pollForLightStateChanges = async (params) => {
  // the docs suggest keeping requests to the bridge under 10 per second
  await sleep(process.env.STATE_CHANGE_MONITOR_INTERVAL);

  const lightStateReqs = [];
  params.lights.forEach((lightObj) => {
    // poll for each light

    // in newer versions of the bridge we would be able to
    // only make one request: `/api/${process.env.USER_NAME}/lights`
    // however in older versions this request does not
    // contain light state info

    // also note that polling each light in `params.lights` does
    // not allow for discovery of new lights -- we would have to
    // make a call to `/api/${process.env.USER_NAME}/lights`
    // but I am not sure if that is in the scope of the challenge
    lightStateReqs.push(rp(lightObj.stateReqOptions).then((lightStateRes) => {
      if (_.has(lightStateRes, 'error')) {
        console.log(`error response from polling light ${lightObj.id}: ${lightStateRes}`);
      }
      if (_.has(lightStateRes, 'name') && lightObj.name !== lightStateRes.name) {
        lightObj.name = lightStateRes.name;
        console.log(JSON.stringify({ id: lightObj.id, name: lightObj.name }));
      }
      if (_.has(lightStateRes, 'state.on') && lightObj.on !== lightStateRes.state.on) {
        lightObj.on = lightStateRes.state.on;
        console.log(JSON.stringify({ id: lightObj.id, on: lightObj.on }));
      }
      // this will not necessarily print a change to brightness if the new `bri` is different
      // but the `brightness` (%) is the same because of rounding
      // this would be easy to change though
      if (_.has(lightStateRes, 'state.bri') && lightObj.brightness !== scaleBrightness(lightStateRes.state.bri)) {
        lightObj.brightness = scaleBrightness(lightStateRes.state.bri);
        console.log(JSON.stringify({ id: lightObj.id, brightness: lightObj.brightness }));
      }
    }));
  });

  try {
    await Promise.all(lightStateReqs);
  } catch (err) {
    console.log(`error making requests to get light states: ${err}`);
  }

  // recurse
  return pollForLightStateChanges(params);
};

module.exports = {
  pollForLightStateChanges,
};
