import { INestApplication, INestApplicationContext, INestMicroservice } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CrudConfigService } from '@nestjsx/crud';
import { urlencoded, json } from 'express';
import { useContainer } from 'class-validator';
import cors from 'cors';
import helmet from 'helmet';
import query from 'qs-middleware';

import { config } from '../config';
import { AppLogger } from './app.logger';

/**
 * START NOTICE
 * TypeScript decorators are executed when we declare our class but not
 * when we create new class instance
 */
CrudConfigService.load({
    query: {
        limit: 0,
        cache: 2000
    },
    params: {
        id: {
            field: 'id',
            type: 'uuid',
            primary: true
        }
    },
    routes: {
        exclude: ['createManyBase'],
        updateOneBase: {
            allowParamsOverride: false
        },
        deleteOneBase: {
            returnDeleted: true
        }
    }
});
/* END NOTICE */

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './_helpers/filters';

const rateLimit = require('express-rate-limit');

export class AppDispatcher {
    private app: INestApplication;
    private microservice: INestMicroservice;
    private logger = new AppLogger(AppDispatcher.name);

    async dispatch(): Promise<void> {
        await this.createServer();
        this.createMicroservices();
        await this.startMicroservices();
        return this.startServer();
    }

    async shutdown(): Promise<void> {
        await this.app.close();
    }

    public getContext(): Promise<INestApplicationContext> {
        return NestFactory.createApplicationContext(AppModule);
    }

    private async createServer(): Promise<void> {
        this.app = await NestFactory.create(AppModule, {
            logger: new AppLogger('Nest')
        });

        useContainer(this.app.select(AppModule), { fallbackOnErrors: true });

        // this.app.u.useStaticAssets(path.join(__dirname, '/../public'));

        this.app.use(cors());
        this.app.use(query());

        this.app.use(json({ limit: '2mb' }));
        this.app.use(urlencoded({ extended: true, limit: '2mb' }));

        this.app.useGlobalFilters(new HttpExceptionFilter());
        /* this.app.useGlobalPipes(new ValidationPipe(config.validator.options)); */

        if (config.isProduction) {
            this.app.use(helmet());

            this.app.use( // limit each IP to 250 requests per 15 minutes
                rateLimit({
                    windowMs: 15 * 60 * 1000,
                    max: 250,
                    message:
                        'Too many requests from this IP, please try again later'
                })
            );
            this.app.use( // limit each IP to 10 email signup requests per hour
                '/auth/register',
                rateLimit({
                    windowMs: 60 * 60 * 1000,
                    max: 10,
                    message:
                        'Too many accounts created from this IP, please try again after an hour'
                })
            );
        }

        const options = new DocumentBuilder()
            .setTitle(config.name)
            .setDescription(config.description)
            .setVersion(config.version)
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(this.app, options);
        SwaggerModule.setup('/docs', this.app, document);
    }

    private createMicroservices(): void {
        this.microservice = this.app.connectMicroservice(config.microservice);
    }

    private startMicroservices(): Promise<void> {
        return this.app.startAllMicroservicesAsync();
    }

    private async startServer(): Promise<void> {
        await this.app.listen(config.port, config.host);
        this.logger.log(`Swagger is exposed at http://${config.host}:${config.port}/docs`);
        this.logger.log(`Server is listening http://${config.host}:${config.port}`);
    }
}
