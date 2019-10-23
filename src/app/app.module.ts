import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';

import { config } from '../config';
import { AuthModule } from './auth/auth.module';
import { AppLogger } from './app.logger';
import { HealthCheckModule } from './healthcheck/healthcheck.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';
import { ProjectModule } from './project/project.module';
import { GqlConfigService, RequestContextMiddleware } from './_helpers';
import { ProjectContextMiddleware } from './project/project-context.middleware';
import { ProjectController } from './project/project.controller';
import { ExerciseContextMiddleware } from './exercises/exercise-context.middleware';
import { ExerciseController } from './exercises/exercise.controller';
import { ExerciseModule } from './exercises/exercise.module';

@Module({
    imports: [
        TypeOrmModule.forRoot(config.database),
        CommandModule,
        HealthCheckModule,
        AuthModule,
        UserModule,
        ProjectModule,
        ExerciseModule,
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
            .apply(ProjectContextMiddleware)
            .forRoutes(ProjectController);
        consumer
            .apply(ExerciseContextMiddleware)
            .forRoutes(ExerciseController);
    }
}
