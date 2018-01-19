# Installation

### Dependencies 
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- either [docker](https://docs.docker.com/docker-for-mac/install/) or [node.js](https://nodejs.org/en/download/) ~ 8.4.3

- clone and `cd` into the repo
```bash
git clone https://github.com/minervas/hueCodeChallenge.git;
cd hueCodeChallenge;
```
- now you can build and run with either docker or node.js 

### Configuration
This app can be configured two ways
- by using environment variables 
- by editing the `./config/default.json` file directly

Here is a description of the config variables that are available:

- `BRIDGE_IP`: the IP of the running bridge (default "127.0.0.1")
- `BRIDGE_PORT`: the port of the running bridge (default 8080)
- `USER_NAME`: the user name to issue api requests against (default "newdeveloper")
- `REQUEST_TIMEOUT`: how many milliseconds to wait before timing out a request to the bridge (default 3000)
- `LIGHT_SEARCH_INTERVAL`: not currently used
- `LIGHT_SEARCH_DURATION`: not currently used
- `STATE_CHANGE_MONITOR_INTERVAL`: how many milliseconds to wait until polling the bridge for light state changes (default 1000)

(using environment variables is a little easier when you are running it with docker)

NOTE: The script will fail immediately if it is not configured with the correct BRIDGE_IP and BRIDGE_PORT (or if the bridge on that IP:PORT is not currently running at startup). I have not yet implemented the bridge discovery as I am not sure if it is within the scope of the challenge.

NOTE: The `USER_NAME` must be valid see `./index.js` comments for more details

## Installation with docker
- build the container:
```bash
docker build -t hue-code-challenge:1.0.0 .;
docker run -it --rm -e "BRIDGE_IP=<your bridge ip here>" -e "BRIDGE_PORT=<your bridge port here>"" hue-code-challenge:1.0.0;
```

## Installation with Node.js
```bash
npm install;
BRIDGE_IP=<your bridge ip here> BRIDGE_PORT=<your bridge port here> npm start;
```