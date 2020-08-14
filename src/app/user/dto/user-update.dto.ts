import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEmail, Validate, IsArray, IsEnum } from 'class-validator';
import { Column } from 'typeorm';

import { UserRole } from '../../access-control/user-role.enum';
import { UniqueEmailValidator } from '../../_helpers/validators/unique-email.validator';

export class UserUpdateDto {

    @ApiProperty()
    @IsOptional()
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    public first_name: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    public last_name: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(200, { always: true })
    public institution: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public country: string;

    @ApiProperty()
    @IsOptional()
    @IsString({ always: true })
    @IsEmail({ require_tld: true }, { always: true })
    @MaxLength(200, { always: true })
    @Validate(UniqueEmailValidator, {
        message: 'User already exists'
    })
    public email: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(50, { always: true })
    public phone_num: string;

    @ApiProperty()
    @IsOptional({ always: true })
    public profile_img: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsArray({ always: true })
    @IsEnum(UserRole, { each: true, always: true })
    public roles: UserRole[] = [UserRole.USER];

    @ApiProperty()
    @IsOptional({ always: true })
    public facebook_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    public google_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    public twitter_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    public github_id: string;
}

