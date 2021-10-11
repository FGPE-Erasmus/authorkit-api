import {
    IsString,
    IsOptional,
    Matches,
    MinLength,
    MaxLength
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CredentialsDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9]+([_.-]?[a-zA-Z0-9])*$/)
    @MinLength(4)
    @MaxLength(50)
    username: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    scope?: string;

    @IsString()
    @IsOptional()
    refreshToken?: string;

    @IsString()
    @IsOptional()
    redirectUri?: string;
}
