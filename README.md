# FGPE AuthorKit API

## Description

## Start Guide

### Outside Docker containers

- Create .env file `cp .env.example .env` and replace existing env variables
  (mysql/mariadb connection params)
- Install dependencies `yarn`
- Start the app `yarn start` (app will be exposed through the port 3000)

### Inside Docker containers

Just run already prepared bash script:
```bash
$ ./init
```
It will setup the project for you (building the Docker images, starting docker-compose stack).
The NestJS app running in dev mode will be exposed on `http://localhost` (port 80)

For IDE autocompletion to work, run `yarn` on the host machine.

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

Integrated Configuration Module so we can just inject `ConfigService`
and read all environment variables from `.env` file, which is created automatically by the init script from `.env.example`.

## Swagger

To see all available endpoints visit http://localhost/api/docs

## TypeORM integrated

[TypeORM](http://typeorm.io/) gives the possibility to use next db types:
`mysql`, `postgres`, `mariadb`, `sqlite`, `mongodb` etc. Please look at docs for more details.

We are using `mongodb`.

## Authentication - JWT and OAuth2

## Security
The API implements some of nodejs security techniques:
 * Helmet : to protect from some well-known web vulnerabilities by setting HTTP headers appropriately
 * Express Rate Limit: to protect from brute-force attacks.
 * CSurf: to protect from CSRF attacks.