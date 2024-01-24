FROM node:20-alpine

WORKDIR /usr/src/app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

RUN mkdir /config

# Use pm2 to run app
RUN npm i -g pm2

# Symlink config file
RUN rm -f config.json
RUN ln -s /config/config.json ./config.json

CMD pm2-runtime server.js
