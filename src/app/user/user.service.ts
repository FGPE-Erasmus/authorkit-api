import { HttpException, HttpStatus, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Repository, DeepPartial } from 'typeorm';
import { CrudService } from '../../base';
import { passwordHash, RestException, ValidationPhases } from '../_helpers';
import { AppLogger } from '../app.logger';
import { CredentialsDto } from '../auth/dto/credentials.dto';
import { UserEmailEntity, UserEntity } from './entity';
import { UserErrorEnum } from './user-error.enum';
import { USER_EMAIL_TOKEN, USER_TOKEN } from './user.constants';

@Injectable()
export class UserService extends CrudService<UserEntity> {
    private logger = new AppLogger(UserService.name);

    constructor(
        @Inject(USER_TOKEN) protected readonly repository: Repository<UserEntity>,
        @Inject(USER_EMAIL_TOKEN) protected readonly userEmailRepository: Repository<UserEmailEntity>
    ) {
        super();
    }

    public async findByEmail(email: string): Promise<UserEntity> {
        this.logger.debug(`[findByEmail] Looking in users for ${email}`);
        const user = await this.findOne({ where: { email } }, true);
        if (user) {
            this.logger.debug(`[findByEmail] Found in users an user with id ${user.id}`);
        } else {
            this.logger.debug(`[findByEmail] Not found in users an user with email ${email}`);
        }
        return user;
    }

    public async login(credentials: CredentialsDto): Promise<UserEntity> {
        const user = await this.findByEmail(credentials.email);

        if (!user) {
            throw new HttpException({
                error: 'User',
                message: `User not found`
            }, HttpStatus.NOT_FOUND);
        }

        if (user.password !== passwordHash(credentials.password)) {
            throw new BadRequestException(`Credentials do not match`);
        }

        if (!user.is_verified) {
            throw new RestException({
                error: 'User',
                message: `User is not verified`,
                condition: UserErrorEnum.NOT_VERIFIED
            }, HttpStatus.PRECONDITION_FAILED);
        }

        return user;
    }

    public async register(data: DeepPartial<UserEntity>): Promise<UserEntity> {
        const entity = this.repository.create(data);
        await this.validate(entity);
        entity.hashPassword();
        const user = await entity.save();
        return user;
    }

    public async updatePassword(data: DeepPartial<UserEntity>): Promise<UserEntity> {
        const entity = await this.repository.findOneOrFail(data.id);
        entity.password = data.password;
        await this.validate(entity, {
            groups: [ValidationPhases.UPDATE]
        });
        entity.hashPassword();
        return this.repository.save(entity);
    }

    public async socialRegister(data: DeepPartial<UserEntity>) {
        const entity = this.repository.create(data);
        await this.validate(entity, { skipMissingProperties: true });
        return this.repository.save(entity);
    }
}
