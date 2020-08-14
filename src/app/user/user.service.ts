import { HttpException, HttpStatus, Injectable, BadRequestException } from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudValidationGroups } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { passwordHash, RestException, validateEntity } from '../_helpers';
import { AppLogger } from '../app.logger';
import { CredentialsDto } from '../auth/dto/credentials.dto';
import { UserEntity } from './entity';
import { UserErrorEnum } from './user-error.enum';

@Injectable()
export class UserService extends TypeOrmCrudService<UserEntity> {

    private logger = new AppLogger(UserService.name);

    constructor(
        @InjectRepository(UserEntity) protected readonly repository: Repository<UserEntity>
    ) {
        super(repository);
    }

    public async findByEmail(email: string): Promise<UserEntity> {
        this.logger.debug(`[findByEmail] Looking in users for ${email}`);
        const user = await this.findOne(null, { where: { email } });
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
        await validateEntity(entity);
        entity.hashPassword();
        const user = await entity.save();
        return user;
    }

    public async updatePassword(data: DeepPartial<UserEntity>): Promise<UserEntity> {
        const entity = await this.repository.findOneOrFail(data.id);
        entity.password = data.password;
        await validateEntity(entity, {
            groups: [CrudValidationGroups.UPDATE]
        });
        entity.hashPassword();
        return this.repository.save(entity);
    }

    public async updatePasswordWithOld(data: DeepPartial<UserEntity>, oldPassword: string): Promise<UserEntity> {
        const user = await this.repository.findOneOrFail(data.id);
        if (!user) {
            throw new HttpException({
                error: 'User',
                message: `User not found`
            }, HttpStatus.NOT_FOUND);
        }
        if (user.password !== passwordHash(oldPassword)) {
            throw new BadRequestException(`Old password does not match`);
        }
        return this.updatePassword(data);
    }

    public async socialRegister(data: DeepPartial<UserEntity>) {
        const entity = this.repository.create(data);
        await validateEntity(entity, { skipMissingProperties: true });
        return this.repository.save(entity);
    }
}
