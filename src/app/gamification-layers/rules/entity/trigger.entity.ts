import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import { IsOptional, IsDefined, IsEnum, IsBoolean, IsString } from 'class-validator';
import { CrudValidationGroups } from '@nestjsx/crud';
import { TriggerKind } from './trigger-kind.enum';
import { TriggerEvent } from './trigger-event.enum';

const { CREATE, UPDATE } = CrudValidationGroups;

export class TriggerEntity {

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(TriggerKind, { always: true })
    @Column({
        type: 'enum',
        enum: TriggerKind
    })
    public kind: TriggerKind;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsDefined({ groups: [CREATE] })
    @IsEnum(TriggerEvent, { always: true })
    @Column({
        type: 'enum',
        enum: TriggerEvent
    })
    public event: TriggerEvent;

    @ApiProperty()
    @IsOptional({ groups: [UPDATE] })
    @IsBoolean({ groups: [CREATE] })
    @Column({
        type: 'boolean',
        default: true
    })
    public recurrent: Boolean;

    @ApiProperty()
    @IsOptional({ always: true })
    @IsString({ each: true, always: true })
    @Column('simple-array', { default: '' })
    public parameters: string[];
}
