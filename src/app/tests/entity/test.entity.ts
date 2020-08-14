import { Column, PrimaryGeneratedColumn, ManyToOne, Entity, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEmpty, IsDefined, IsUUID, IsString, IsNumber, Max, Min, IsBoolean } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { TrackedFileEntity, ResourceEntity } from '../../_helpers';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';
import { TestSetEntity } from '../../testsets/entity/testset.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('test')
export class TestEntity extends TrackedFileEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.tests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Index()
    public exercise_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => TestSetEntity, testset => testset.tests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'testset_id' })
    @Column('uuid', { nullable: true })
    @Index()
    public testset_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    public input: ResourceEntity;

    @ApiProperty()
    @IsOptional({ always: true })
    @Column('simple-json', { nullable: true })
    public output: ResourceEntity;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ each: true, always: true })
    @Column('simple-array')
    public arguments: string[] = [];

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Max(100, { always: true })
    @Min(0, { always: true })
    @Column('real', { nullable: false })
    public weight: number;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column('boolean', { default: true })
    public visible: boolean;
}
