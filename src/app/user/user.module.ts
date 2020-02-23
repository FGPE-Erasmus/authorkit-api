import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { AccessControlModule } from '../access-control';
import { accessRules } from '../app.access-rules';
import { OnlineService } from './online.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserCommand } from './user.command';
import { UserEntity } from './entity';
import { USER_EMAIL_QUEUE } from './user.constants';
import { UserEmailProcessor } from './user-email.processor';
import { UserEmailQueueConfigService } from './user-email-queue-config.service';

const PROVIDERS = [
    UserService,
    OnlineService,
    UserResolver,
    UserCommand,

    UserEmailQueueConfigService,
    UserEmailProcessor
];

@Module({
    controllers: [UserController],
    providers: [...PROVIDERS],
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        AccessControlModule.forRoles(accessRules),
        BullModule.registerQueueAsync({
            name: USER_EMAIL_QUEUE,
            useClass: UserEmailQueueConfigService
        })
    ],
    exports: [UserService, OnlineService, UserEmailQueueConfigService]
})
export class UserModule {
}
