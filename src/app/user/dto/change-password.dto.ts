import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {

    @ApiProperty()
    @IsString()
    readonly old_password: string;

    @ApiProperty()
    @IsString()
    readonly new_password: string;
}
