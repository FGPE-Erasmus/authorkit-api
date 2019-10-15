import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, ObjectIdColumn, Column, ManyToOne, ObjectID, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Field } from 'type-graphql';
import { IsString, IsOptional, Length, MaxLength, IsEnum, IsNotEmpty, Validate } from 'class-validator';

import { ExtendedEntity, GithubReponameValidator, GithubUsernameValidator } from '../../_helpers';
import { UserEntity } from '../../user/entity';
import { ProjectEntity } from '../../project/entity';

import { ExerciseDifficulty } from './exercise-difficulty.enum';
import { ExerciseType } from './exercise-type.enum';
import { ExerciseStatus } from './exercise-status.enum';
import { ExerciseInstructionEntity } from './exercise-instruction.entity';
import { ExerciseStatementEntity } from './exercise-statement.entity';
import { ExerciseEmbeddableEntity } from './exercise-embeddable.entity';
import { ExerciseLibraryEntity } from './exercise-library.entity';
import { ExerciseStaticCorrectorEntity } from './exercise-static-corrector.entity';
import { ExerciseDynamicCorrectorEntity } from './exercise-dynamic-corrector.entity';
import { ExerciseTestGeneratorEntity } from './exercise-test-generator.entity';
import { ExerciseFeedbackGeneratorEntity } from './exercise-feedback-generator.entity';
import { ExerciseSkeletonEntity } from './exercise-skeleton.entity';
import { ExerciseSolutionEntity } from './exercise-solution.entity';
import { ExerciseTemplateEntity } from './exercise-template.entity';
import { ExerciseTestSetEntity } from './exercise-test-set.entity';
import { ExerciseTestEntity } from './exercise-test.entity';

@Entity('exercise')
export class ExerciseEntity extends ExtendedEntity {

    @ApiModelProperty()
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiModelProperty()
    @IsString()
    @MaxLength(250)
    @Column()
    public title: string;

    @Column()
    public module: string;

    @ManyToOne(type => UserEntity, author => author.exercises)
    @Field(type => ProjectEntity)
    public author: UserEntity;

    @ManyToOne(type => ProjectEntity, project => project.exercises)
    @Field(type => ProjectEntity)
    public project: ProjectEntity;

    @Column('simple-array', { default: [] })
    public keywords: string[];

    @Column()
    public type: ExerciseType;

    @Column()
    public event: string;

    @Column()
    public platform: string;

    @Column({
        type: 'enum',
        enum: ExerciseDifficulty
    })
    public difficulty: ExerciseDifficulty;

    @Column({
        type: 'enum',
        enum: ExerciseStatus,
        default: ExerciseStatus.DRAFT
    })
    public status: ExerciseStatus;

    @OneToMany(type => ExerciseInstructionEntity, instruction => instruction.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseInstructionEntity])
    public instructions: ExerciseInstructionEntity[];

    @OneToMany(type => ExerciseStatementEntity, statement => statement.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseStatementEntity])
    public statements: ExerciseStatementEntity[];

    @OneToMany(type => ExerciseEmbeddableEntity, embeddable => embeddable.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseEmbeddableEntity])
    public embeddables: ExerciseEmbeddableEntity[];

    @OneToMany(type => ExerciseLibraryEntity, library => library.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseLibraryEntity])
    public libraries: ExerciseLibraryEntity[];

    @OneToMany(type => ExerciseStaticCorrectorEntity, static_corrector => static_corrector.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseStaticCorrectorEntity])
    public static_correctors: ExerciseStaticCorrectorEntity[];

    @OneToMany(type => ExerciseDynamicCorrectorEntity, dynamic_corrector => dynamic_corrector.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseDynamicCorrectorEntity])
    public dynamic_correctors: ExerciseDynamicCorrectorEntity[];

    @OneToMany(type => ExerciseTestGeneratorEntity, test_generator => test_generator.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseTestGeneratorEntity])
    public test_generators: ExerciseTestGeneratorEntity[];

    @OneToMany(type => ExerciseFeedbackGeneratorEntity, test_generator => test_generator.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseFeedbackGeneratorEntity])
    public feedback_generators: ExerciseFeedbackGeneratorEntity[];

    @OneToMany(type => ExerciseSkeletonEntity, skeleton => skeleton.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseSkeletonEntity])
    public skeletons: ExerciseSkeletonEntity[];

    @OneToMany(type => ExerciseSolutionEntity, solution => solution.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseSolutionEntity])
    public solutions: ExerciseSolutionEntity[];

    @OneToMany(type => ExerciseTemplateEntity, tmpl => tmpl.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseTemplateEntity])
    public templates: ExerciseTemplateEntity[];

    @OneToMany(type => ExerciseTestEntity, test => test.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseTestEntity])
    public tests: ExerciseTestEntity[];

    @OneToMany(type => ExerciseTestSetEntity, testSet => testSet.exercise, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true
    })
    @Field(type => [ExerciseTestSetEntity])
    public testSets: ExerciseTestSetEntity[];

}
