import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength, Validate, ValidateIf, IsEnum, IsArray, IsEmpty, ArrayNotContains, IsDefined } from 'class-validator';
import { DateTime } from 'luxon';
import { ExtendedEntity, passwordHash, PasswordValidator, ValidationPhases } from '../../_helpers';
import { IsUserAlreadyExist } from '../user.validator';
import { config } from '../../../config';
import { Column, Entity, ObjectIdColumn, ObjectID } from 'typeorm';
import { Exclude, Transform } from 'class-transformer';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

@Entity()
export class UserEntity extends ExtendedEntity {

    @ApiModelProperty()
    @ObjectIdColumn()
    @Transform((id: ObjectID) => id.toHexString(), {toPlainOnly: true})
    public id: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public first_name: string;

    @ApiModelProperty()
    @IsString()
    @Column()
    public last_name: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public institution: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public country: string;

    @ApiModelProperty()
    @IsOptional({ groups: [ValidationPhases.UPDATE] })
    @IsString()
    @IsEmail()
    @Validate(IsUserAlreadyExist, {
        message: 'User already exists'
    })
    @Column()
    public email: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @Column()
    public phone_num: string;

    @ApiModelProperty()
    @IsOptional()
    @IsUrl()
    @Column()
    public profile_img: string;

    @ApiModelProperty()
    @Exclude()
    @IsOptional({ groups: [ValidationPhases.UPDATE] })
    @IsDefined()
    @MinLength(config.validator.password.min_length)
    @Validate(PasswordValidator)
    @Column()
    public password: string;

    @ApiModelProperty()
    @Column()
    public is_verified = false;

    @ApiModelProperty()
    @IsOptional()
    @IsArray()
    @IsEnum(UserRole, { each: true })
    @Column()
    public roles: UserRole[] = [UserRole.USER];

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public provider: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public facebook_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public google_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public twitter_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column()
    public github_id: string;

    @Column()
    public online_at: DateTime;

    hashPassword() {
        if (this.password) {
            this.password = passwordHash(this.password);
        }
    }
}
