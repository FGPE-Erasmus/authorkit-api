import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Field } from 'type-graphql';
import { IsString, MaxLength, IsEnum, IsNotEmpty, Validate, IsEmpty, IsOptional, IsDefined, IsUUID, IsArray } from 'class-validator';

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
import { TrackedFileEntity } from './tracked-file.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise')
export class ExerciseEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    @Field()
    public title: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: true })
    @Field()
    public module: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'owner_id' })
    @Column('uuid', { nullable: false })
    public owner_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ProjectEntity, project => project.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    @Column('uuid', { nullable: false })
    public project_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public keywords: string[];

    @ApiModelProperty({ required: true })
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ExerciseType, { always: true })
    @Column({
        type: 'enum',
        enum: ExerciseType
    })
    public type: ExerciseType;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(250, { always: true })
    @Column('varchar', { length: 250, nullable: true })
    public event: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(250, { always: true })
    @Column('varchar', { length: 250, nullable: true })
    public platform: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(ExerciseDifficulty, { always: true })
    @Column({
        type: 'enum',
        enum: ExerciseDifficulty
    })
    public difficulty: ExerciseDifficulty;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsEnum(ExerciseStatus, { always: true })
    @Column({
        type: 'enum',
        enum: ExerciseStatus,
        default: ExerciseStatus.DRAFT
    })
    public status: ExerciseStatus;

    @OneToMany(() => ExerciseInstructionEntity, instruction => instruction.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseInstructionEntity])
    public instructions: ExerciseInstructionEntity[];

    @OneToMany(() => ExerciseStatementEntity, statement => statement.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseStatementEntity])
    public statements: ExerciseStatementEntity[];

    @OneToMany(() => ExerciseEmbeddableEntity, embeddable => embeddable.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseEmbeddableEntity])
    public embeddables: ExerciseEmbeddableEntity[];

    @OneToMany(() => ExerciseLibraryEntity, library => library.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseLibraryEntity])
    public libraries: ExerciseLibraryEntity[];

    @OneToMany(() => ExerciseStaticCorrectorEntity, static_corrector => static_corrector.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseStaticCorrectorEntity])
    public static_correctors: ExerciseStaticCorrectorEntity[];

    @OneToMany(() => ExerciseDynamicCorrectorEntity, dynamic_corrector => dynamic_corrector.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseDynamicCorrectorEntity])
    public dynamic_correctors: ExerciseDynamicCorrectorEntity[];

    @OneToMany(() => ExerciseTestGeneratorEntity, test_generator => test_generator.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseTestGeneratorEntity])
    public test_generators: ExerciseTestGeneratorEntity[];

    @OneToMany(() => ExerciseFeedbackGeneratorEntity, test_generator => test_generator.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseFeedbackGeneratorEntity])
    public feedback_generators: ExerciseFeedbackGeneratorEntity[];

    @OneToMany(() => ExerciseSkeletonEntity, skeleton => skeleton.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseSkeletonEntity])
    public skeletons: ExerciseSkeletonEntity[];

    @OneToMany(() => ExerciseSolutionEntity, solution => solution.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseSolutionEntity])
    public solutions: ExerciseSolutionEntity[];

    @OneToMany(() => ExerciseTemplateEntity, tmpl => tmpl.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseTemplateEntity])
    public templates: ExerciseTemplateEntity[];

    @OneToMany(() => ExerciseTestEntity, test => test.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseTestEntity])
    public tests: ExerciseTestEntity[];

    @OneToMany(() => ExerciseTestSetEntity, testset => testset.exercise_id, {
        cascade: true,
        eager: true
    })
    @Field(() => [ExerciseTestSetEntity])
    public test_sets: ExerciseTestSetEntity[];

}
