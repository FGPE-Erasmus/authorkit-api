import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class JwtDto {

    @ApiProperty()
    @IsNumber()
    readonly expiresIn: number;

    @ApiProperty()
    @IsString()
    readonly accessToken: string;

    @ApiProperty()
    @IsString()
    readonly refreshToken: string;
}
