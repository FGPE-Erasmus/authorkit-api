import { HttpModule, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionModule } from '../permissions/permission.module';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';
import { GithubApiModule } from '../github-api/github-api.module';

import { GamificationLayerService } from './gamification-layer.service';
import { GamificationLayerController } from './gamification-layer.controller';
import { GamificationLayerEntity } from './entity/gamification-layer.entity';

const PROVIDERS = [
    GamificationLayerService
];

const MODULES = [
    TypeOrmModule.forFeature([GamificationLayerEntity]),
    HttpModule,
    PermissionModule,
    forwardRef(() => UserModule),
    ProjectModule,
    GithubApiModule
];

@Module({
    controllers: [GamificationLayerController],
    providers: [...PROVIDERS],
    imports: [...MODULES],
    exports: [GamificationLayerService]
})
export class GamificationLayerModule {}
