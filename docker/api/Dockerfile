# the builder
FROM node:14-alpine AS builder

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk add --no-cache py-pip make g++

COPY package*.json nodemon*.json ./

RUN npm install


# the server
FROM node:14-alpine

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk add --no-cache bash coreutils

COPY --from=builder /usr/src/app/node_modules node_modules

COPY . .

CMD [ "npm", "run", "watch:dev" ]
