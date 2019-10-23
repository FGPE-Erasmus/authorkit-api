import { ApiModelProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsEmail, IsOptional, IsString, MinLength, Validate, IsEnum, IsArray, IsDefined, MaxLength, IsBoolean, IsEmpty } from 'class-validator';
import { Column, Entity, ObjectIdColumn, ObjectID, OneToMany, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate, JoinColumn } from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { Field } from 'type-graphql';

import { config } from '../../../config';
import { ExtendedEntity, Lazy, passwordHash, PasswordValidator } from '../../_helpers';
import { UserRole } from '../../access-control';
import { ProjectEntity, PermissionEntity } from '../../project/entity';
import { ExerciseEntity } from '../../exercises/entity';
import { UniqueEmailValidator } from '../../_helpers/validators/unique-email.validator';
import { DateTime } from 'luxon';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('user')
export class UserEntity extends ExtendedEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public first_name: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public last_name: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(200, { always: true })
    @Column('varchar', { length: 200, nullable: true })
    public institution: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public country: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsString({ always: true })
    @IsEmail({ require_tld: true }, { always: true })
    @MaxLength(200, { always: true })
    @Validate(UniqueEmailValidator, {
        groups: [CREATE],
        message: 'User already exists'
    })
    @Column('varchar', { length: 200, unique: true, nullable: false })
    public email: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(50, { always: true })
    @Column('varchar', { length: 50, nullable: true })
    public phone_num: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column({ type: 'bytea', nullable: true })
    public profile_img: Buffer;

    @ApiModelProperty()
    @Exclude()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ always: true })
    @MinLength(config.validator.password.min_length, { always: true })
    @Validate(PasswordValidator, { always: true })
    @Column('varchar', { nullable: false })
    public password: string;

    @ApiModelProperty()
    @Column('boolean', { default: false })
    public is_verified = false;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsArray({ always: true })
    @IsEnum(UserRole, { each: true, always: true })
    @Column('enum', { enum: UserRole, array: true, default: [UserRole.USER] })
    public roles: UserRole[] = [UserRole.USER];

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public facebook_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public google_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public twitter_id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public github_id: string;

    @Column('varchar', { default: 'registration' })
    public provider: string;

    @Column('timestamptz', { nullable: true })
    public online_at: DateTime;

    @OneToMany(() => PermissionEntity, permission => permission.user_id, { lazy: true })
    @Field(() => [PermissionEntity])
    public permissions: Lazy<PermissionEntity[]>;

    @OneToMany(() => ProjectEntity, project => project.owner_id, { lazy: true })
    @Field(() => [ProjectEntity])
    public projects: Lazy<ProjectEntity[]>;

    @OneToMany(() => ExerciseEntity, exercise => exercise.owner_id, { lazy: true })
    @Field(() => [ExerciseEntity])
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
