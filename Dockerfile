FROM node:8.9.4

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# don't make node PID 1
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# make node user
RUN groupadd -r nodejs \
   && useradd -m -r -g nodejs nodejs

USER nodejs

# Bundle app source
COPY . /usr/src/app

# Start the app
CMD [ "dumb-init", "npm", "start" ]