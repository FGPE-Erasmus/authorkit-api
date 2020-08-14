import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyResendDto {

    @ApiProperty()
    @IsString()
    readonly email: string;
}
