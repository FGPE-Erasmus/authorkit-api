import { ApiModelProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MinLength, Validate, IsEnum, IsArray, IsDefined, MaxLength, IsBoolean } from 'class-validator';
import { Column, Entity, ObjectIdColumn, ObjectID, OneToMany, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { Field } from 'type-graphql';

import { config } from '../../../config';
import { ExtendedEntity, Lazy, passwordHash, PasswordValidator, ValidationPhases } from '../../_helpers';
import { ProjectEntity, PermissionEntity } from '../../project/entity';
import { ExerciseEntity } from '../../exercises/entity';
import { IsUserAlreadyExist } from '../user.validator';
import { DateTime } from 'luxon';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

@Entity('user')
export class UserEntity extends ExtendedEntity {

    @ApiModelProperty()
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiModelProperty()
    @IsString()
    @MaxLength(100)
    @Column('varchar', { length: 100, nullable: true })
    public first_name: string;

    @ApiModelProperty()
    @IsString()
    @MaxLength(100)
    @Column('varchar', { length: 100, nullable: true })
    public last_name: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(200)
    @Column('varchar', { length: 200, nullable: true })
    public institution: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @Column('varchar', { length: 100, nullable: true })
    public country: string;

    @ApiModelProperty()
    @IsOptional({ groups: [ValidationPhases.UPDATE] })
    @IsString()
    @IsEmail()
    @MaxLength(200)
    @Validate(IsUserAlreadyExist, {
        message: 'User already exists'
    })
    @Column('varchar', { length: 200, nullable: false })
    public email: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    @Column('varchar', { length: 50, nullable: true })
    public phone_num: string;

    @ApiModelProperty()
    @IsOptional()
    @Column({ type: 'bytea', nullable: true })
    public profile_img: Buffer;

    @ApiModelProperty()
    @Exclude()
    @IsOptional({ groups: [ValidationPhases.UPDATE] })
    @IsDefined()
    @MinLength(config.validator.password.min_length)
    @Validate(PasswordValidator)
    @Column('varchar', { nullable: false })
    public password: string;

    @ApiModelProperty()
    @IsBoolean()
    @Column('boolean', { default: false })
    public is_verified = false;

    @ApiModelProperty()
    @IsOptional()
    @IsArray()
    @IsEnum(UserRole, { each: true })
    @Column('enum', { enum: UserRole, array: true, default: [UserRole.USER] })
    public roles: UserRole[] = [UserRole.USER];

    @ApiModelProperty()
    @IsOptional()
    @Column('varchar', { default: 'registration' })
    public provider: string;

    @ApiModelProperty()
    @IsOptional()
    @Column('varchar', { nullable: true })
    public facebook_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column('varchar', { nullable: true })
    public google_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column('varchar', { nullable: true })
    public twitter_id: string;

    @ApiModelProperty()
    @IsOptional()
    @Column('varchar', { nullable: true })
    public github_id: string;

    @Column('timestamptz', { nullable: true })
    public online_at: DateTime;

    @OneToMany(type => ProjectEntity, project => project.owner, { lazy: true })
    @Field(type => [ProjectEntity])
    public owned_projects: Lazy<ProjectEntity[]>;

    @OneToMany(type => PermissionEntity, permission => permission.user, { lazy: true })
    @Field(type => [PermissionEntity])
    public permissions: Lazy<PermissionEntity[]>;

    @OneToMany(type => ExerciseEntity, exercise => exercise.author, { lazy: true })
    @Field(type => [ExerciseEntity])
    public exercises: Lazy<ExerciseEntity[]>;

    hashPassword() {
        if (this.password) {
            this.password = passwordHash(this.password);
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    correctProfileImage() {
        if (this.profile_img) {
            this.profile_img = ('\\x' + this.profile_img.toString('hex')) as any;
        }
    }
}
