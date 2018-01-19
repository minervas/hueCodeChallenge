/* eslint no-console: 'off' */

const rp = require('request-promise');
const _ = require('lodash');
const {
  setEnv,
  scaleBrightness,
  // it sounds like polling for new lights might be beyond the scope
  // of the challenge per my conversation with Scotty
  // pollForNewLights,
  pollForLightStateChanges,
} = require('./util');

// merge config and environment variables to config
setEnv();

// set some default request options
const reqOptions = {
  url: `http://${process.env.BRIDGE_IP}:${process.env.BRIDGE_PORT}/api`,
  json: true,
  method: 'GET',
  timeout: parseInt(process.env.REQUEST_TIMEOUT, 10),
};

const lights = [];

(async () => {
  const ro = _.cloneDeep(reqOptions);
  // get our initial light state for all lights

  // I am assuming that the user for this app already
  // exists as I don't have physical access to your
  // bulb to press the link button, which is required
  // for user creation

  // it looks like the hue-simulartor is running an old version of the bridge
  // in a newer version we could use the `/api/<username>/lights` endpoint
  ro.url = `${ro.url}/${process.env.USER_NAME}`;
  let fullState;
  try {
    fullState = await rp(ro);
  } catch (err) {
    // HACK:
    // I am not sure if this is an issue with the hue-simulator package or
    // my request library, but if you make a `get full state` request on a
    // user that doesn't exist the request will hang until I get a socket
    // hangup error
    // so I am assuming the bridge will respond in process.env.REQUEST_TIMEOUT
    // milliseconds if the user is valid and the bridge is reachable
    if (err.message === 'Error: ESOCKETTIMEDOUT') {
      console.log('Error talking to Hue Bridge');
      console.log(`The bridge is either unreachable at ${ro.url}`);
      console.log(`or the user: ${process.env.USER_NAME} does not exist`);
      process.exit(1);
    } else {
      console.log('received error while getting the initial full state');
      console.log(err);
      process.exit(1);
    }
  }

  if (!_.isObject(fullState) || _.has(fullState, 'error')) {
    console.log('received error while getting the initial full state');
    console.log(`fullState response: ${JSON.stringify(fullState)}`);
    process.exit(1);
  }

  const logLights = [];
  if (!_.isEmpty(fullState.lights)) {
    // we have some lights to add to the `lights` array;
    _.forIn(fullState.lights, (lightState, lightId) => {
      if (_.has(lightState, 'name') && !_.isEmpty(lightId) && _.has(lightState, 'state.on') && _.has(lightState, 'state.bri')) {
        const stateReqOptions = _.cloneDeep(reqOptions);
        stateReqOptions.url = `${stateReqOptions.url}/${process.env.USER_NAME}/lights/${lightId}`;
        const light = {
          stateReqOptions,
          name: lightState.name,
          // if we were using a late enough version of the bridge we might consider
          // using the luminaireuniqueid or uniqueid field for this value
          id: lightId,
          on: lightState.state.on,
          // do we want to consider a light that is off to be at 0% brightness?
          brightness: scaleBrightness(lightState.state.bri),
        };
        lights.push(light);
        logLights.push(_.pick(light, ['name', 'id', 'on', 'brightness']));
      }
    });
  }
  console.log(logLights);

  // see pollForNewLights import comment above
  // pollForNewLights({
  //   firstConnTime,
  //   reqOptions,
  //   lights,
  // });

  pollForLightStateChanges({
    lights,
  });
})();
