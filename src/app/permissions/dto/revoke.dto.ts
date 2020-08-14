import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDefined } from 'class-validator';

export class RevokeDto {

    @ApiProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    readonly project_id: string;

    @ApiProperty()
    @IsDefined({ always: true })
    @IsUUID('4', { always: true })
    readonly user_id: string;
}
