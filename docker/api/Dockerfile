# the builder
FROM node:16-alpine AS builder

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk add --no-cache py-pip make g++

COPY package*.json nodemon*.json ./

RUN yarn install


# the server
FROM node:16-alpine

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN apk add --no-cache bash coreutils

COPY --from=builder /usr/src/app/node_modules node_modules

COPY . .

CMD [ "yarn", "watch:dev" ]
