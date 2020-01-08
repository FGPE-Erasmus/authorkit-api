import { SetMetadata } from '@nestjs/common';

import { AccessLevel } from '../entity/access-level.enum';

// tslint:disable-next-line:variable-name
export const MinAccessLevel = (accessLevel: AccessLevel) => SetMetadata('minAccessLevel', accessLevel);
