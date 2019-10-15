import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, OneToMany, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsOptional, Length, MaxLength, IsEnum, IsNotEmpty, Validate } from 'class-validator';

import { ExtendedEntity, GithubReponameValidator, GithubUsernameValidator, Lazy } from '../../_helpers';
import { UserEntity } from '../../user/entity';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';
import { ProjectStatus } from './project-status.enum';
import { PermissionEntity } from './permission.entity';

@Entity('project')
export class ProjectEntity extends ExtendedEntity {

    @ApiModelProperty()
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiModelProperty()
    @IsString()
    @Length(2, 50)
    @Column('varchar', { length: 50 })
    public name: string;

    @ApiModelProperty()
    @IsOptional()
    @IsString()
    @MaxLength(250)
    @Column('varchar', { length: 250 })
    public description: string;

    @ApiModelProperty()
    @IsString()
    @Column('uuid', { nullable: false })
    public owner_id: string;

    @ApiModelProperty()
    @Column('boolean', { default: true })
    public is_public: boolean;

    @ApiModelProperty()
    @IsString()
    @IsEnum(ProjectStatus)
    @Column('enum', {
        enum: ProjectStatus,
        default: ProjectStatus.DRAFT
    })
    public status: ProjectStatus = ProjectStatus.DRAFT;

    @ApiModelProperty()
    @IsString()
    @IsNotEmpty()
    @Validate(GithubUsernameValidator)
    @Column('varchar', { length: 40 })
    public repo_owner: string;

    @ApiModelProperty()
    @IsString()
    @IsNotEmpty()
    @Validate(GithubReponameValidator)
    @Column('varchar', { length: 100 })
    public repo_name: string;

    @ManyToOne(() => UserEntity, user => user.owned_projects)
    @JoinColumn({ name: 'owner_id' })
    public owner: Lazy<UserEntity>;

    @OneToMany(() => PermissionEntity, permission => permission.project, { cascade: true })
    @Field(() => [PermissionEntity])
    public permissions: PermissionEntity[];

    @OneToMany(() => ExerciseEntity, exercise => exercise.project, { lazy: true })
    @Field(() => [ExerciseEntity])
    public exercises: Lazy<ExerciseEntity[]>;

    public getSshCloneUrl(): string {
        return `git@github.com:${this.repo_owner}/${this.repo_name}.git`;
    }

    public getHttpCloneUrl(): string {
        return `https://github.com/${this.repo_owner}/${this.repo_name}.git`;
    }

}
