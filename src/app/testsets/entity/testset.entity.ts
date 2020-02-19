import { Column, PrimaryGeneratedColumn, Entity, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Field } from 'type-graphql';
import { CrudValidationGroups } from '@nestjsx/crud';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsOptional, IsEmpty, IsDefined, IsString, MaxLength, IsNumber, Max, Min, IsBoolean } from 'class-validator';

import { TrackedFileEntity } from '../../_helpers';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';
import { TestEntity } from '../../tests/entity/test.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('testset')
export class TestSetEntity extends TrackedFileEntity {

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    @Field()
    public id: string;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.test_sets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    @Index()
    @Field()
    public exercise_id: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsString({ always: true })
    @MaxLength(100, { always: true })
    @Column('varchar', { length: 100, nullable: false })
    @Field()
    public name: string;

    @ApiModelProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { always: true })
    @Max(100, { always: true })
    @Min(0, { always: true })
    @Column('real', { nullable: false })
    @Field()
    public weight: number;

    @ApiModelProperty()
    @IsOptional({ always: true })
    @IsBoolean({ always: true })
    @Column('boolean', { default: true })
    @Field()
    public visible: boolean;

    @OneToMany(() => TestEntity, test => test.testset_id, {
        eager: true,
        cascade: true
    })
    @Field(() => [TestEntity])
    public tests: TestEntity[];
}
