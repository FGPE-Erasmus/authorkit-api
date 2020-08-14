import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

import { config } from '../../../config';
import { UserRole } from '../../access-control';

export class UserEntityDto {

    @ApiProperty()
    @IsString()
    public first_name: string;

    @ApiProperty()
    @IsString()
    public last_name: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public institution?: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public country?: string;

    @ApiProperty()
    @IsString()
    public email: string;

    @ApiProperty({
        minLength: config.validator.password.min_length
    })
    @IsString()
    public password: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public phone_num?: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public profile_img?: string;

    @ApiProperty({
        required: false
    })
    @IsArray()
    public roles?: UserRole[];

    @ApiProperty({
        required: false
    })
    @IsString()
    public facebook_id?: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public google_id?: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public twitter_id?: string;

    @ApiProperty({
        required: false
    })
    @IsString()
    public github_id?: string;
}
