import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FacebookTokenDto {

    @ApiProperty()
    @IsString()
    readonly access_token: string;
}
