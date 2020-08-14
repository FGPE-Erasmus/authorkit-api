import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class TokenDto {

    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNumber()
    expiresIn: number;

    @ApiProperty()
    @IsString()
    audience: string;

    @ApiProperty()
    @IsString()
    issuer: string;
}
