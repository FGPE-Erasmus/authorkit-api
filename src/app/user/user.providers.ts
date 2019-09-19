import { DB_CON_TOKEN } from '../database/database.constants';
import { UserEmailEntity, UserEntity } from './entity';
import { USER_EMAIL_TOKEN, USER_TOKEN } from './user.constants';
import { Connection } from 'typeorm';

export const userProviders = [
    {
        provide: USER_TOKEN,
        useFactory: (connection: Connection) => connection.getRepository(UserEntity),
        inject: [DB_CON_TOKEN]
    },
    {
        provide: USER_EMAIL_TOKEN,
        useFactory: (connection: Connection) => connection.getRepository(UserEmailEntity),
        inject: [DB_CON_TOKEN]
    }
];
