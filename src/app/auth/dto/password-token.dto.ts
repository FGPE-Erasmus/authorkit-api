import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PasswordTokenDto {

    @ApiProperty()
    @IsString()
    readonly resetToken: string;

    @ApiProperty()
    @IsString()
    readonly password: string;
}
