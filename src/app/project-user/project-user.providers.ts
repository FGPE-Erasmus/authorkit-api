import { Connection } from 'typeorm';

import { DB_CON_TOKEN } from '../database/database.constants';
import { PROJECT_USER_TOKEN } from './project-user.constants';
import { ProjectUserEntity } from './entity';

export const projectUserProviders = [
    {
        provide: PROJECT_USER_TOKEN,
        useFactory: (connection: Connection) => connection.getRepository(ProjectUserEntity),
        inject: [DB_CON_TOKEN]
    }
];
