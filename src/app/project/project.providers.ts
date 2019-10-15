import { Connection } from 'typeorm';

import { DB_CON_TOKEN } from '../database/database.constants';
import { PROJECT_TOKEN, PERMISSION_TOKEN } from './project.constants';
import { ProjectEntity, PermissionEntity } from './entity';

export const projectProviders = [
    {
        provide: PROJECT_TOKEN,
        useFactory: (connection: Connection) => connection.getRepository(ProjectEntity),
        inject: [DB_CON_TOKEN]
    },
    {
        provide: PERMISSION_TOKEN,
        useFactory: (connection: Connection) => connection.getRepository(PermissionEntity),
        inject: [DB_CON_TOKEN]
    }
];
