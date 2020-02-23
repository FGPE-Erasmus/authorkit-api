import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { UserModule } from '../user/user.module';
import { USER_EMAIL_QUEUE } from '../user/user.constants';
import { UserEmailQueueConfigService } from '../user/user-email-queue-config.service';
import { UserEntity } from '../user/entity';
import { JwtStrategy, FacebookTokenStrategy } from './stategies';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        UserModule,
        TypeOrmModule.forFeature([UserEntity]),
        BullModule.registerQueueAsync({
            name: USER_EMAIL_QUEUE,
            imports: [UserModule],
            useExisting: UserEmailQueueConfigService
        })
    ],
    providers: [AuthService, JwtStrategy, FacebookTokenStrategy],
    controllers: [AuthController]
})
export class AuthModule {
}
