import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MessageDto {

    @ApiProperty()
    @IsString()
    subject: string;

    @ApiProperty()
    @IsString()
    description: string;
}
