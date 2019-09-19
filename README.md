# FGPE AuthorKit API

The API of a toolkit to author gamified activities to support programming learning. This is part of the Erasmus+ Project entitled Framework for Gamified Programming Education (FGPE).

## Requirements

* Node Version Manager [n](https://www.npmjs.com/package/n)
* Docker + Docker Compose
* npm

## Installation

```bash
$ npm install
```

## Configuration

Copy file `.env.example` and name it `.env`

These are environment variables required for application to start.

* `APP_DATABASE_TYPE` is a type of database for `TypeORM`
* `APP_DATABASE_LOGGING` is a logging level for `TypeORM`
* `APP_LOGGER_LEVEL` is a logging level for `Nest.js`

## Start Guide

### Outside Docker containers

- Create .env file `cp .env.example .env` and replace existing env variables
  (mysql/mariadb connection params)
- Install dependencies `npm install`
- Start the app `npm run start`

### Inside Docker containers

Just run already prepared bash script:
```bash
$ ./init
```
It will setup the project for you (building the Docker images, starting docker-compose stack).
The NestJS app running in dev mode will be exposed on `http://localhost` (port 80)

For IDE autocompletion to work, run `yarn` on the host machine.

### Working w/ the app

```bash
# Bring up the docker with api, database, ...
$ docker-compose up -d

# development
$ npm run start

# build
$ npm run build

# production mode
$ npm run prod

# fix lint errors
$ npm run lint:fix
```

## Docker build

### Build image

To build a docker image, execute:

```bash
$ ./build.sh
```

## Test

```bash
# unit tests
$ docker exec -it nest yarn test

# e2e tests
$ docker exec -it nest yarn test:e2e

# test coverage
$ docker exec -it nest yarn test:cov
```

## Environment Configuration

and read all environment variables from `.env` file, which is created automatically by the init script from `.env.example`.

## Swagger

To see all available endpoints visit http://localhost/api/docs

## TypeORM integrated

[TypeORM](http://typeorm.io/) gives the possibility to use next db types:
`mysql`, `postgres`, `mariadb`, `sqlite`, `mongodb` etc. Please look at docs for more details.

We are using `mongodb`.


