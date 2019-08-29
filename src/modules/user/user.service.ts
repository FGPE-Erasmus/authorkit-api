import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { generateToken } from '../../common/utils/token.util';
import { User, UserFillableFields } from './user.entity';
import { RegisterPayload } from 'modules/auth/payloads';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: MongoRepository<User>,
        private readonly i18n: I18nService,
    ) { }

    async get(id: number): Promise<User> {
        return this.userRepository.findOne(id);
    }

    async getByEmail(email: string): Promise<User> {
        return await this.userRepository.findOne({ email });
    }

    async getByUsername(username: string): Promise<User> {
        return await this.userRepository.findOne({ username });
    }

    async getByUsernameOrEmail(username?: string, email?: string): Promise<User> {
        if (username) {
            return await this.getByUsername(username);
        } else {
            return await this.getByEmail(email);
        }
    }

    async getByActivationToken(activationToken: string): Promise<User> {
        return await this.userRepository.findOne({ activationToken });
    }

    async getByResetToken(resetToken: string): Promise<User> {
        return await this.userRepository.findOne({ resetToken });
    }

    async registerUser(payload: RegisterPayload): Promise<User> {
        let user = await this.getByUsername(payload.username);
        if (user) {
            throw new NotAcceptableException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.BAD_REQUEST.USERNAME_ALREADY_EXISTS'),
            );
        }
        user = await this.getByEmail(payload.email);
        if (user) {
            throw new NotAcceptableException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.BAD_REQUEST.EMAIL_ALREADY_EXISTS'),
            );
        }

        return await this.userRepository.save(
            this.userRepository.create(/* Object.assign({ activationToken: await generateToken()  }, */payload/* )  */),
        );
    }

    async create(payload: User) {
        const user = await this.getByEmail(payload.email);

        if (user) {
            throw new NotAcceptableException(
                'User with provided email already created.',
            );
        }

        return await this.userRepository.save(
            this.userRepository.create(payload),
        );
    }

    async update(
        id: number,
        payload: UserFillableFields,
    ) {
        const user = await this.get(id);
        if (!user) {
            throw new NotFoundException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.NOT_FOUND.USER_NOT_FOUND'));
        }

        if (payload._id) {
            delete payload._id;
        }

        const newUser = Object.assign(user, payload);

        return await this.userRepository.save(newUser);
    }
}
