import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { UserEntity } from './entity';

@Injectable()
export class OnlineService {
    private online = new Map<string, UserEntity>();

    constructor(@InjectRepository(UserEntity) protected readonly repository: Repository<UserEntity>) {

    }

    public isOnline(user: UserEntity): boolean {
        return this.online.has(user.id.toString());
    }

    public isOffline({ id }: UserEntity): boolean {
        return !this.online.has(id.toString());
    }

    public async addUser(user: UserEntity): Promise<OnlineService> {
        user.online_at = DateTime.utc();
        await this.repository.update(user.id, user);
        this.online.set(user.id.toString(), user);
        return this;
    }

    public async removeUser(user: UserEntity): Promise<OnlineService> {
        user.online_at = DateTime.utc();
        await this.repository.update(user.id, user);
        this.online.delete(user.id.toString());
        return this;
    }
}
