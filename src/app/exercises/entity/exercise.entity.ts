import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToMany } from 'typeorm';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsString, MaxLength, IsEnum, IsNotEmpty, IsEmpty, IsOptional, IsDefined, IsUUID, IsArray, IsNumber } from 'class-validator';

import { TrackedFileEntity } from '../../_helpers';
import { UserEntity } from '../../user/entity/user.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { ChallengeEntity } from '../../gamification-layers/challenges/entity/challenge.entity';
import { DynamicCorrectorEntity } from '../../dynamic-correctors/entity/dynamic-corrector.entity';
import { EmbeddableEntity } from '../../embeddables/entity/embeddable.entity';
import { FeedbackGeneratorEntity } from '../../feedback-generators/entity/feedback-generator.entity';
import { LibraryEntity } from '../../libraries/entity/library.entity';
import { InstructionEntity } from '../../instructions/entity/instruction.entity';
import { StaticCorrectorEntity } from '../../static-correctors/entity/static-corrector.entity';
import { SkeletonEntity } from '../../skeletons/entity/skeleton.entity';
import { SolutionEntity } from '../../solutions/entity/solution.entity';
import { StatementEntity } from '../../statements/entity/statement.entity';
import { TemplateEntity } from '../../templates/entity/template.entity';
import { TestGeneratorEntity } from '../../test-generators/entity/test-generator.entity';
import { TestSetEntity } from '../../testsets/entity/testset.entity';
import { TestEntity } from '../../tests/entity/test.entity';

import { ExerciseDifficulty } from './exercise-difficulty.enum';
import { ExerciseType } from './exercise-type.enum';
import { ExerciseStatus } from './exercise-status.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('exercise')
export class ExerciseEntity extends TrackedFileEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: false })
    public title: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(150, { always: true })
    @Column('varchar', { length: 150, nullable: true })
    public module: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'owner_id' })
    @Column('uuid', { nullable: false })
    public owner_id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNotEmpty({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ProjectEntity, project => project.exercises, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    @Column('uuid', { nullable: false })
    public project_id: string;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: [] })
    public keywords: string[];

    @ApiProperty({ required: true })
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(ExerciseType, { always: true })
    @Column({
        type: 'varchar',
        length: 15,
        enum: ExerciseType,
        default: ExerciseType.BLANK_SHEET
    })
    public type: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(250, { always: true })
    @Column('varchar', { length: 250, nullable: true })
    public event: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ always: true })
    @MaxLength(250, { always: true })
    @Column('varchar', { length: 250, nullable: true })
    public platform: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsEnum(ExerciseDifficulty, { always: true })
    @Column({
        type: 'varchar',
        length: 10,
        enum: ExerciseDifficulty,
        default: ExerciseDifficulty.EASY
    })
    public difficulty: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsEnum(ExerciseStatus, { always: true })
    @Column({
        type: 'varchar',
        length: 15,
        enum: ExerciseStatus,
        default: ExerciseStatus.DRAFT
    })
    public status: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Column('real', { default: -1 })
    public timeout: number;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsArray({ always: true })
    @IsString({ always: true, each: true })
    @MaxLength(50, { always: true, each: true })
    @Column('simple-array', { default: () => '(\'[]\')' })
    public programmingLanguages: string[];

    @OneToMany(() => InstructionEntity, instruction => instruction.exercise_id, {
        cascade: true,
        eager: true
    })
    public instructions: InstructionEntity[];

    @OneToMany(() => StatementEntity, statement => statement.exercise_id, {
        cascade: true,
        eager: true
    })
    public statements: StatementEntity[];

    @OneToMany(() => EmbeddableEntity, embeddable => embeddable.exercise_id, {
        cascade: true,
        eager: true
    })
    public embeddables: EmbeddableEntity[];

    @OneToMany(() => LibraryEntity, library => library.exercise_id, {
        cascade: true,
        eager: true
    })
    public libraries: LibraryEntity[];

    @OneToMany(() => StaticCorrectorEntity, static_corrector => static_corrector.exercise_id, {
        cascade: true,
        eager: true
    })
    public static_correctors: StaticCorrectorEntity[];

    @OneToMany(() => DynamicCorrectorEntity, dynamic_corrector => dynamic_corrector.exercise_id, {
        cascade: true,
        eager: true
    })
    public dynamic_correctors: DynamicCorrectorEntity[];

    @OneToMany(() => TestGeneratorEntity, test_generator => test_generator.exercise_id, {
        cascade: true,
        eager: true
    })
    public test_generators: TestGeneratorEntity[];

    @OneToMany(() => FeedbackGeneratorEntity, test_generator => test_generator.exercise_id, {
        cascade: true,
        eager: true
    })
    public feedback_generators: FeedbackGeneratorEntity[];

    @OneToMany(() => SkeletonEntity, skeleton => skeleton.exercise_id, {
        cascade: true,
        eager: true
    })
    public skeletons: SkeletonEntity[];

    @OneToMany(() => SolutionEntity, solution => solution.exercise_id, {
        cascade: true,
        eager: true
    })
    public solutions: SolutionEntity[];

    @OneToMany(() => TemplateEntity, tmpl => tmpl.exercise_id, {
        cascade: true,
        eager: true
    })
    public templates: TemplateEntity[];

    @OneToMany(() => TestEntity, test => test.exercise_id, {
        cascade: true,
        eager: true
    })
    public tests: TestEntity[];

    @OneToMany(() => TestSetEntity, testset => testset.exercise_id, {
        cascade: true,
        eager: true
    })
    public test_sets: TestSetEntity[];

    @ManyToMany(() => ChallengeEntity, challenge => challenge.exercises, { onDelete: 'CASCADE' })
    public challenges: ChallengeEntity[];

}
