import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsOptional, Length, MaxLength, IsEnum, IsDefined, IsEmpty } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExtendedEntity, Lazy } from '../../_helpers';
import { UserEntity } from '../../user/entity/user.entity';
import { PermissionEntity } from '../../permissions/entity/permission.entity';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';
import { GamificationLayerEntity } from '../../gamification-layers/entity';
import { ProjectStatus } from './project-status.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('project')
export class ProjectEntity extends ExtendedEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @Length(2, 50, { always: true })
    @Column('varchar', { length: 50 })
    @Field()
    public name: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(250, { always: true })
    @Column('varchar', { length: 250 })
    @Field()
    public description: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @ManyToOne(() => UserEntity, user => user.projects)
    @JoinColumn({ name: 'owner_id' })
    @Column('uuid', { nullable: false })
    @Field()
    public owner_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @Column('boolean', { default: true })
    @Field()
    public is_public: boolean;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsEnum(ProjectStatus, { always: true })
    @Column('enum', {
        enum: ProjectStatus,
        default: ProjectStatus.DRAFT
    })
    @Field(() => ProjectStatus)
    public status: ProjectStatus = ProjectStatus.DRAFT;

    /* @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsNotEmpty({ always: true })
    @MaxLength(40)
    @Validate(GithubUsernameValidator, { always: true })
    @Column('varchar', { length: 40 })
    @Field()
    public repo_owner: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @IsNotEmpty({ always: true })
    @MaxLength(100)
    @Validate(GithubReponameValidator, { always: true })
    @Column('varchar', { length: 100 })
    @Field()
    public repo_name: string; */

    @OneToMany(() => PermissionEntity, permission => permission.project_id, {
        cascade: false
    })
    @Field(() => [PermissionEntity])
    public permissions: PermissionEntity[];

    @OneToMany(() => ExerciseEntity, exercise => exercise.project_id, {
        lazy: true,
        cascade: false
    })
    @Field(() => [ExerciseEntity])
    public exercises: Lazy<ExerciseEntity[]>;

    @OneToMany(() => GamificationLayerEntity, gl => gl.project_id, { lazy: true })
    @Field(() => [GamificationLayerEntity])
    public gamification_layers: Lazy<GamificationLayerEntity[]>;

    /* public getSshCloneUrl(): string {
        return `git@github.com:${this.repo_owner}/${this.repo_name}.git`;
    }

    public getHttpCloneUrl(): string {
        return `https://github.com/${this.repo_owner}/${this.repo_name}.git`;
    } */

}
