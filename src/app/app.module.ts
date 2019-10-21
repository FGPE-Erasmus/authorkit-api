import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';

import { AuthModule } from './auth/auth.module';
import { AppLogger } from './app.logger';
import { DatabaseModule } from './database/database.module';
import { HealthCheckModule } from './healthcheck/healthcheck.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';
import { ProjectModule } from './project/project.module';
import { GqlConfigService, RequestContextMiddleware } from './_helpers';
import { SecurityModule } from './security';
import { ProjectMiddleware } from './project/project.middleware';
import { ProjectController } from './project/project.controller';
import { config } from '../config';

@Module({
    imports: [
        TypeOrmModule.forRoot(config.database),
        CommandModule,
        HealthCheckModule,
        SecurityModule,
        // DatabaseModule,
        AuthModule,
        UserModule,
        ProjectModule,
        GraphQLModule.forRootAsync({
            imports: [SharedModule, UserModule],
            useClass: GqlConfigService
        })
    ]
})
export class AppModule {
    private logger = new AppLogger(AppModule.name);

    constructor() {
        this.logger.log('Initialize constructor');
    }

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestContextMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
        consumer
            .apply(ProjectMiddleware)
            .forRoutes(ProjectController);
    }
}
