import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsDefined, IsEmail } from 'class-validator';

import { AccessLevel } from '../entity/access-level.enum';

export class ShareByEmailDto {

    @ApiProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    readonly project_id: string;

    @ApiProperty()
    @IsEmail({}, { always: true })
    readonly email: string;

    @ApiProperty()
    @IsDefined({ always: true })
    @IsEnum(AccessLevel, { always: true })
    readonly access_level: AccessLevel;
}
