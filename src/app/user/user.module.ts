import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserCommand } from './user.command';
import { UserEntity } from './entity';
import { USER_EMAIL_QUEUE } from './user.constants';
import { UserEmailProcessor } from './user-email.processor';
import { UserEmailQueueConfigService } from './user-email-queue-config.service';

const PROVIDERS = [
    UserService,
    UserCommand,

    UserEmailQueueConfigService,
    UserEmailProcessor
];

@Module({
    controllers: [UserController],
    providers: [...PROVIDERS],
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        BullModule.registerQueueAsync({
            name: USER_EMAIL_QUEUE,
            useClass: UserEmailQueueConfigService
        })
    ],
    exports: [UserService, UserEmailQueueConfigService]
})
export class UserModule {
}
