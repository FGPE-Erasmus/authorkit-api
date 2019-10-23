import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy, FacebookTokenStrategy } from './stategies';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { UserEntity } from '../user/entity';

@Module({
    imports: [UserModule, TypeOrmModule.forFeature([UserEntity])],
    providers: [AuthService, JwtStrategy, FacebookTokenStrategy],
    controllers: [AuthController]
})
export class AuthModule {
}
