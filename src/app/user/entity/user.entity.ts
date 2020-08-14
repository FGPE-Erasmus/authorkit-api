import { ApiProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsEmail, IsOptional, IsString, MinLength, Validate, IsEnum, IsArray, IsDefined, MaxLength, IsEmpty } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { DateTime } from 'luxon';

import { config } from '../../../config';
import { ExtendedEntity, Lazy, passwordHash, PasswordValidator } from '../../_helpers';
import { UserRole } from '../../access-control';
import { PermissionEntity } from '../../permissions/entity';
import { ProjectEntity } from '../../project/entity';
import { ExerciseEntity } from '../../exercises/entity';
import { UniqueEmailValidator } from '../../_helpers/validators/unique-email.validator';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('user')
export class UserEntity extends ExtendedEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public first_name?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public last_name?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(200, { always: true })
    @Column('varchar', { length: 200, nullable: true })
    public institution?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: true })
    public country?: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsString({ always: true })
    @IsEmail({ require_tld: true }, { always: true })
    @MaxLength(200, { always: true })
    @Validate(UniqueEmailValidator, {
        groups: [CREATE],
        message: 'User already exists'
    })
    @Column('varchar', { length: 200, unique: true, nullable: false })
    public email?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(50, { always: true })
    @Column('varchar', { length: 50, nullable: true })
    public phone_num?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public profile_img?: string;

    @ApiProperty()
    @Exclude({ toPlainOnly: true })
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ always: true })
    @MinLength(config.validator.password.min_length, { always: true })
    @Validate(PasswordValidator, { always: true })
    @Column('varchar', { nullable: false })
    public password?: string;

    @ApiProperty()
    @Column('boolean', { default: false })
    public is_verified = false;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsArray({ always: true })
    @IsEnum(UserRole, { each: true, always: true })
    @Column('enum', { enum: UserRole, array: true, default: [UserRole.USER] })
    public roles?: UserRole[] = [UserRole.USER];

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public facebook_id?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public google_id?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public twitter_id?: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('varchar', { nullable: true })
    public github_id?: string;

    @Column('varchar', { default: 'registration' })
    public provider?: string;

    @OneToMany(() => PermissionEntity, permission => permission.user_id, { lazy: true })
    public permissions?: Lazy<PermissionEntity[]>;

    @OneToMany(() => ProjectEntity, project => project.owner_id, { lazy: true })
    public projects?: Lazy<ProjectEntity[]>;

    @OneToMany(() => ExerciseEntity, exercise => exercise.owner_id, { lazy: true })
    public exercises?: Lazy<ExerciseEntity[]>;

    hashPassword() {
        if (this.password) {
            this.password = passwordHash(this.password);
        }
    }
}
