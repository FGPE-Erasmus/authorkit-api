import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Command, Positional } from 'nestjs-command';
import { DateTime } from 'luxon';
import faker from 'faker';
import { plainToClass } from 'class-transformer';
import { UserService } from './user.service';
import { UserEntity } from './entity';
import { AppLogger } from '../app.logger';

@Injectable()
export class UserCommand {

    private logger = new AppLogger(UserCommand.name);

    constructor(
        @InjectRepository(UserEntity) protected readonly repository: Repository<UserEntity>
    ) {
        faker.locale = 'en_US';
    }

    // example usage: npm run cli -- create:user 100
    @Command({ command: 'create:user [amount]', describe: 'create a user' })
    public async create(@Positional({ name: 'amount' }) amount) {
        amount = parseInt(amount || 10, 10);
        this.logger.debug(`[create] execute for amount ${amount}!`);

        this.logger.debug(`[create] delete from db everything with provider "faker"`);
        await this.repository.delete({ provider: 'faker' });

        const persons: UserEntity[] = [];
        for (let i = 0; i < amount; i++) {
            const first_name = faker.name.firstName();
            const last_name = faker.name.lastName();
            const person: UserEntity = plainToClass(UserEntity, {
                first_name,
                last_name,
                is_verified: true,
                provider: 'faker',
                facebook_id: faker.random.uuid(),
                google_id: faker.random.uuid(),
                twitter_id: faker.random.uuid(),
                github_id: faker.random.uuid(),
                email: faker.internet.email(first_name, last_name).toLowerCase(),
                password: faker.internet.password(),
                phone_num: faker.phone.phoneNumber(),
                profile_img: faker.internet.avatar(),
                created_at: DateTime.utc().toString(),
                updated_at: DateTime.utc().toString()
            });
            persons.push(person);
            this.logger.debug(`[create] create random person ppl with provider "faker" as ${JSON.stringify(person)}`);
            // await this.userService.create(person);
        }

        this.logger.debug(`[create] create ${amount} random ppl with provider "faker"`);
        await this.repository.save(persons);
    }
}
