/* eslint no-console: 'off' */
const rp = require('request-promise');
const _ = require('lodash');
const Promise = require('bluebird');

const { sleep } = require('./sleep.js');
const { scaleBrightness } = require('./scaleBrightness.js');

// TODO add request retry logic
async function poll(params) {
  // see if we have some new lights since last time that we searched
  let newLightsRes;
  try {
    newLightsRes = await rp(params.newLightsReqOptions);
  } catch (err) {
    console.log(`error making new lights request: ${err}`);
  }
  if (_.has(newLightsRes, 'error')) {
    console.log(`error returned in new lights request: ${newLightsRes.error}`);
  }
  // filter out keys that are not new lights
  const newLightsObj = _.omit(newLightsRes, ['error', 'lastscan']);
  const newLights = _.keys(newLightsObj);

  // make requests to get data for the new lights
  // this could be done with one request on a later version
  // of the bridge
  const newLightDataPromises = [];
  newLights.forEach((lightId) => {
    const lightDataReqOptions = _.cloneDeep(params.reqOptions);
    lightDataReqOptions.url = `${lightDataReqOptions.url}/${process.env.USER_NAME}/lights/${lightId}`;
    newLightDataPromises.push(rp(lightDataReqOptions));
  });

  let newLightData;
  try {
    newLightData = await Promise.all(newLightDataPromises);
  } catch (err) {
    console.log(`error requesting new light data: ${err}`);
  }

  let lightIdIndex = -1;
  newLightData.forEach((lightData) => {
    lightIdIndex += 1;
    if (_.has(lightData, 'error')) {
      console.log(`error returned from new light data request: ${lightData}`);
    } else if (_.has(lightData, 'name') && _.has(lightData, 'state.on') && _.has(lightData, 'state.bri')) {
      // log data from new light (not sure if you only want the id paired with
      // each state attribute in this case)
      const fmtLightData = {
        name: lightData.name,
        // if we were using a late enough version of the bridge we might consider
        // using the luminaireuniqueid or uniqueid field for this value
        id: newLights[lightIdIndex],
        on: lightData.state.on,
        // do we want to consider a light that is off to be at 0% brightness?
        brightness: scaleBrightness(lightData.state.bri),
      };
      console.log(fmtLightData);
      // add new light data to `lights` array
      params.lights.push(fmtLightData);
    }
  });

  // wait LIGHT_SEARCH_INTERVAL milliseconds before beginning the search for more lights
  await sleep(process.env.LIGHT_SEARCH_INTERVAL);

  let newSearchRes;
  try {
    newSearchRes = await rp(params.newSearchReqOptions);
  } catch (err) {
    console.log(`error making light search request: ${err}`);
  }
  if (_.has(newSearchRes, 'error')) {
    console.log(`error returned in search request: ${newSearchRes.error}`);
  }
  if (_.size(newSearchRes) < 1 || !_.has(newSearchRes[0], 'success')) {
    console.log(`search request not successful: ${newSearchRes}`);
  }
  // the docs mention that the bridge opens up the network for 40 seconds to search
  // for lights, though it could take longer to add all the new lights if there are
  // a lot
  await sleep(process.env.LIGHT_SEARCH_DURATION);
  // recurse the function
  console.log('repolling');
  return poll(params);
}

module.exports = {
  pollForNewLights: (params) => {
    const pollParams = params;
    pollParams.newLightsReqOptions = _.cloneDeep(pollParams.reqOptions);
    pollParams.newLightsReqOptions.url = `${pollParams.newLightsReqOptions.url}/${process.env.USER_NAME}/lights/new`;

    pollParams.newSearchReqOptions = _.cloneDeep(pollParams.reqOptions);
    pollParams.newSearchReqOptions.url = `${pollParams.newSearchReqOptions.url}/${process.env.USER_NAME}/lights`;
    pollParams.newSearchReqOptions.method = 'POST';
    poll(pollParams);
  },
};
