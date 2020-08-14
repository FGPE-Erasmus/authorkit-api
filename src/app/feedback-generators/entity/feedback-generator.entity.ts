import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { IsOptional, IsEmpty, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ExecutableEntity } from '../../_helpers';
import { GamificationLayerEntity } from '../../gamification-layers/entity/gamification-layer.entity';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('feedback-generator')
export class FeedbackGeneratorEntity extends ExecutableEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.feedback_generators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: true })
    public exercise_id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => GamificationLayerEntity, gl => gl.feedback_generators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gl_id' })
    @Column('uuid', { nullable: true })
    public gl_id: string;
}
