import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { IsOptional, IsEmpty, IsUUID } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';

import { ResourceEntity } from '../../_helpers';
import { ExerciseEntity } from '../../exercises/entity/exercise.entity';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity('embeddable')
export class EmbeddableEntity extends ResourceEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsEmpty({ groups: [CREATE] })
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsUUID('4', { always: true })
    @ManyToOne(() => ExerciseEntity, exercise => exercise.embeddables, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'exercise_id' })
    @Column('uuid', { nullable: false })
    public exercise_id: string;
}
