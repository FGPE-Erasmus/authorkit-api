import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsDefined } from 'class-validator';

import { AccessLevel } from '../entity/access-level.enum';

export class ShareDto {

    @ApiProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    readonly project_id: string;

    @ApiProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    readonly user_id: string;

    @ApiProperty()
    @IsDefined({ always: true })
    @IsEnum(AccessLevel, { always: true })
    readonly access_level: AccessLevel;
}
