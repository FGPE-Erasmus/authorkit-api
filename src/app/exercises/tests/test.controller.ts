import {
    Controller,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    Post,
    Param,
    Body,
    Put,
    Delete,
    UploadedFiles,
    Patch
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';

import { ACGuard, UseRoles, CrudOperationEnum, ResourcePossession, UseContextAccessEvaluator } from '../../access-control';
import { evaluateUserContextAccess } from '../../project/security/project-context-access.evaluator';
import { ExerciseTestEntity } from '../entity/exercise-test.entity';
import { TestService } from './test.service';

@Controller('exercises/:id/tests')
@ApiUseTags('exercises/:id/tests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ACGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TestController {

    constructor(
        protected readonly service: TestService
    ) {}

    @Post()
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: ExerciseTestEntity })
    async createTest(
        @Param('id') exercise_id: string,
        @UploadedFiles() files,
        @Body() dto: ExerciseTestEntity
    ): Promise<ExerciseTestEntity> {
        return this.service.createTest(exercise_id, dto, files.input[0], files.output[0]);
    }

    @Patch('/:test_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'input', maxCount: 1 },
        { name: 'output', maxCount: 1 }
    ]))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'input', required: true })
    @ApiImplicitFile({ name: 'output', required: true })
    @ApiImplicitBody({ name: 'test', type: ExerciseTestEntity })
    async updateTest(
        @Param('id') exercise_id: string,
        @Param('test_id') test_id: string,
        @UploadedFiles() files,
        @Body() dto: ExerciseTestEntity
    ): Promise<ExerciseTestEntity> {
        return this.service.updateTest(exercise_id, test_id, dto, files.input[0], files.output[0]);
    }

    @Delete('/:test_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteTestGenerator(
        @Param('id') exercise_id: string,
        @Param('test_id') test_id: string
    ): Promise<ExerciseTestEntity> {
        return this.service.deleteTest(test_id);
    }
}
