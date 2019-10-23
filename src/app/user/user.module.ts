import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessControlModule } from '../access-control';
import { accessRules } from '../app.access-rules';
import { OnlineService } from './online.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserCommand } from './user.command';
import { UserEntity } from './entity';

const PROVIDERS = [
    UserService,
    OnlineService,
    UserResolver,
    UserCommand
];

@Module({
    controllers: [UserController],
    providers: [...PROVIDERS],
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        AccessControlModule.forRoles(accessRules)
    ],
    exports: [UserService, OnlineService]
})
export class UserModule {
}
