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
import { PermissionModule } from './permissions/permission.module';
import { ExerciseModule } from './exercises/exercise.module';
import { GamificationLayerModule } from './gamification-layers/gamification-layer.module';
import { ChallengeModule } from './gamification-layers/challenges/challenge.module';
import { LeaderboardModule } from './gamification-layers/leaderboards/leaderboard.module';
import { GqlConfigService, RequestContextMiddleware } from './_helpers';
import { ProjectContextMiddleware } from './project/project-context.middleware';
import { ProjectController } from './project/project.controller';
import { ExerciseContextMiddleware } from './exercises/exercise-context.middleware';
import { ExerciseController } from './exercises/exercise.controller';
import { TestController } from './exercises/tests/test.controller';
import { TestSetController } from './exercises/testsets/testset.controller';
import { TestSetContextMiddleware } from './exercises/testsets/testset-context.middleware';

@Module({
    imports: [
        TypeOrmModule.forRoot(config.database),
        CommandModule,
        HealthCheckModule,
        AuthModule,
        PermissionModule,
        UserModule,
        ProjectModule,
        ExerciseModule,
        GamificationLayerModule,
        ChallengeModule,
        LeaderboardModule,
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
            .forRoutes(ExerciseController, TestSetController, TestController);
        consumer
            .apply(TestSetContextMiddleware)
            .forRoutes(TestSetController);
    }
}
