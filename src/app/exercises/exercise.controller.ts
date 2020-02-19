import {
    Post,
    UseInterceptors,
    Controller,
    ClassSerializerInterceptor,
    UseGuards,
    UploadedFile,
    Body,
    Param,
    Patch,
    Delete,
    Get,
    Query,
    Req,
    ForbiddenException,
    BadRequestException
} from '@nestjs/common';
import { ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
import { CrudController, Override, ParsedBody, ParsedRequest, CrudRequest, Crud } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { User } from '../_helpers/decorators/user.decorator';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { ProjectService } from '../project/project.service';

import { ExerciseEntity } from './entity/exercise.entity';
import { ExerciseStaticCorrectorEntity } from './entity/exercise-static-corrector.entity';
import { ExerciseDynamicCorrectorEntity } from './entity/exercise-dynamic-corrector.entity';
import { ExerciseEmbeddableEntity } from './entity/exercise-embeddable.entity';
import { ExerciseFeedbackGeneratorEntity } from './entity/exercise-feedback-generator.entity';
import { ExerciseTestGeneratorEntity } from './entity/exercise-test-generator.entity';
import { ExerciseInstructionEntity } from './entity/exercise-instruction.entity';
import { ExerciseLibraryEntity } from './entity/exercise-library.entity';
import { ExerciseSkeletonEntity } from './entity/exercise-skeleton.entity';
import { ExerciseSolutionEntity } from './entity/exercise-solution.entity';
import { ExerciseStatementEntity } from './entity/exercise-statement.entity';
import { ExerciseTemplateEntity } from './entity/exercise-template.entity';
import { ExerciseService } from './exercise.service';
import { ExerciseCommand } from './exercise.command';
import { ExerciseEmitter } from './exercise.emitter';

@Controller('exercises')
@ApiUseTags('exercises')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ExerciseEntity
    },
    routes: {
        getManyBase: {
            interceptors: [],
            decorators: []
        },
        getOneBase: {
            interceptors: [],
            decorators: []
        },
        createOneBase: {
            interceptors: [],
            decorators: []
        },
        updateOneBase: {
            interceptors: [],
            decorators: []
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [],
            returnDeleted: true
        }
    },
    query: {
        join: {
            'instructions': {
            },
            'statements': {
            },
            'embeddables': {
            },
            'skeletons': {
            },
            'libraries': {
            },
            'static_correctors': {
            },
            'dynamic_correctors': {
            },
            'solutions': {
            },
            'templates': {
            },
            'tests': {
            },
            'test_sets': {
            },
            'test_generators': {
            },
            'feedback_generators': {
            }
        }
    }
})
export class ExerciseController implements CrudController<ExerciseEntity> {


    constructor(
        readonly service: ExerciseService,
        readonly emitter: ExerciseEmitter,
        readonly command: ExerciseCommand,
        readonly projectService: ProjectService
    ) { }

    get base(): CrudController<ExerciseEntity> {
        return this;
    }

    /* @Post('import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async import(): Promise<void> {
        this.logger.silly(`[import] execute `);
        return this.command.create(20);
    } */

    @Override()
    async getOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException('You do not have sufficient privileges');
        }
        return this.base.getOneBase(parsedReq);
    }

    @Override()
    async getMany(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const projectFilterIndex = parsedReq.parsed.filter
            .findIndex(f => f.field === 'project_id' && f.operator === 'eq');
        if (projectFilterIndex < 0) {
            throw new BadRequestException('Exercises must be listed per project');
        }
        const accessLevel = await this.projectService.getAccessLevel(
            parsedReq.parsed.filter[projectFilterIndex].value, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        return this.base.getManyBase(parsedReq);
    }

    @Override()
    async createOne(
        @User() user: any,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        const accessLevel = await this.projectService.getAccessLevel(dto.project_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const exercise = await this.base.createOneBase(parsedReq, dto);
        this.emitter.sendCreate(user, exercise);
        return exercise;
    }

    @Override()
    async updateOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        const exercise = await this.base.updateOneBase(parsedReq, dto);
        this.emitter.sendUpdate(user, exercise);
        return exercise;
    }

    /* @Override()
    async replaceOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(`You do not have sufficient privileges`);
        }
        if (!dto.owner_id) {
            dto.owner_id = user.id;
        }
        const exercise = await this.base.replaceOneBase(parsedReq, dto);
        this.emitter.sendUpdate(user, exercise);
        return exercise;
    } */

    @Override()
    async deleteOne(
        @User() user: any,
        @Req() req,
        @ParsedRequest() parsedReq: CrudRequest
    ) {
        const accessLevel = await this.service.getAccessLevel(req.params.id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        const exercise = await this.base.deleteOneBase(parsedReq);
        if (exercise) {
            this.emitter.sendDelete(user, exercise);
        }
        return exercise;
    }

    /* Extra Files */

    @Get('/:id/files/read')
    async readFile(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Query('pathname') pathname: string
    ): Promise<string> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.VIEWER) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.getExtraFileContents(exercise_id, pathname);
    }

    // dynamic corrector

    @Post('/:id/dynamic-correctors/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'dynamic-corrector', type: ExerciseDynamicCorrectorEntity })
    async createDynamicCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseDynamicCorrectorEntity
    ): Promise<ExerciseDynamicCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseDynamicCorrectorEntity, dto, file);
    }

    @Patch('/:id/dynamic-correctors/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'dynamic-corrector', type: ExerciseDynamicCorrectorEntity })
    async updateDynamicCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseDynamicCorrectorEntity
    ): Promise<ExerciseDynamicCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseDynamicCorrectorEntity, dto, file);
    }

    @Delete('/:id/dynamic-correctors/:file_id')
    async deleteDynamicCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseDynamicCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseDynamicCorrectorEntity);
    }


    // embeddable

    @Post('/:id/embeddables/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'embeddable', type: ExerciseEmbeddableEntity })
    async createEmbeddable(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseEmbeddableEntity
    ): Promise<ExerciseEmbeddableEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseEmbeddableEntity, dto, file);
    }

    @Patch('/:id/embeddables/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'embeddable', type: ExerciseEmbeddableEntity })
    async updateEmbeddable(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseEmbeddableEntity
    ): Promise<ExerciseEmbeddableEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseEmbeddableEntity, dto, file);
    }

    @Delete('/:id/embeddables/:file_id')
    async deleteEmbeddable(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseEmbeddableEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseEmbeddableEntity);
    }


    // feedback generator

    @Post('/:id/feedback-generators/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'feedback-generator', type: ExerciseFeedbackGeneratorEntity })
    async createFeedbackGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseFeedbackGeneratorEntity
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseFeedbackGeneratorEntity, dto, file);
    }

    @Patch('/:id/feedback-generators/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'feedback-generator', type: ExerciseFeedbackGeneratorEntity })
    async updateFeedbackGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseFeedbackGeneratorEntity
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseFeedbackGeneratorEntity, dto, file);
    }

    @Delete('/:id/feedback-generators/:file_id')
    async deleteFeedbackGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseFeedbackGeneratorEntity);
    }

    // instruction

    @Post('/:id/instructions/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: ExerciseInstructionEntity })
    async createInstruction(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseInstructionEntity
    ): Promise<ExerciseInstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseInstructionEntity, dto, file);
    }

    @Patch('/:id/instructions/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: ExerciseInstructionEntity })
    async updateInstruction(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseInstructionEntity
    ): Promise<ExerciseInstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseInstructionEntity, dto, file);
    }

    @Delete('/:id/instructions/:file_id')
    async deleteInstruction(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseInstructionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseInstructionEntity);
    }

    // library

    @Post('/:id/libraries/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'library', type: ExerciseLibraryEntity })
    async createLibrary(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseLibraryEntity
    ): Promise<ExerciseLibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseLibraryEntity, dto, file);
    }

    @Patch('/:id/libraries/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'library', type: ExerciseLibraryEntity })
    async updateLibrary(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseLibraryEntity
    ): Promise<ExerciseLibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseLibraryEntity, dto, file);
    }

    @Delete('/:id/libraries/:file_id')
    async deleteLibrary(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseLibraryEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseLibraryEntity);
    }


    // skeleton

    @Post('/:id/skeletons/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'skeleton', type: ExerciseSkeletonEntity })
    async createSkeleton(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSkeletonEntity
    ): Promise<ExerciseSkeletonEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseSkeletonEntity, dto, file);
    }

    @Patch('/:id/skeletons/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'skeleton', type: ExerciseSkeletonEntity })
    async updateSkeleton(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSkeletonEntity
    ): Promise<ExerciseSkeletonEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseSkeletonEntity, dto, file);
    }

    @Delete('/:id/skeletons/:file_id')
    async deleteSkeleton(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseSkeletonEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseSkeletonEntity);
    }


    // solution

    @Post('/:id/solutions/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'solution', type: ExerciseSolutionEntity })
    async createSolution(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSolutionEntity
    ): Promise<ExerciseSolutionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseSolutionEntity, dto, file);
    }

    @Patch('/:id/solutions/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'solution', type: ExerciseSolutionEntity })
    async updateSolution(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSolutionEntity
    ): Promise<ExerciseSolutionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseSolutionEntity, dto, file);
    }

    @Delete('/:id/solutions/:file_id')
    async deleteSolution(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseSolutionEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseSolutionEntity);
    }


    // statement

    @Post('/:id/statements/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'statement', type: ExerciseStatementEntity })
    async createStatement(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStatementEntity
    ): Promise<ExerciseStatementEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseStatementEntity, dto, file);
    }

    @Patch('/:id/statements/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'statement', type: ExerciseStatementEntity })
    async updateStatement(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStatementEntity
    ): Promise<ExerciseStatementEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseStatementEntity, dto, file);
    }

    @Delete('/:id/statements/:file_id')
    async deleteStatement(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseStatementEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseStatementEntity);
    }


    // static corrector

    @Post('/:id/static-correctors/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'static-corrector', type: ExerciseStaticCorrectorEntity })
    async createStaticCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStaticCorrectorEntity
    ): Promise<ExerciseStaticCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseStaticCorrectorEntity, dto, file);
    }

    @Patch('/:id/static-correctors/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'static-corrector', type: ExerciseStaticCorrectorEntity })
    async updateStaticCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStaticCorrectorEntity
    ): Promise<ExerciseStaticCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseStaticCorrectorEntity, dto, file);
    }

    @Delete('/:id/static-correctors/:file_id')
    async deleteStaticCorrector(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseStaticCorrectorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseStaticCorrectorEntity);
    }


    // template

    @Post('/:id/templates/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'template', type: ExerciseTemplateEntity })
    async createTemplate(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTemplateEntity
    ): Promise<ExerciseTemplateEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseTemplateEntity, dto, file);
    }

    @Patch('/:id/templates/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'template', type: ExerciseTemplateEntity })
    async updateTemplate(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTemplateEntity
    ): Promise<ExerciseTemplateEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseTemplateEntity, dto, file);
    }

    @Delete('/:id/templates/:file_id')
    async deleteTemplate(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseTemplateEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseTemplateEntity);
    }


    // test generator

    @Post('/:id/test-generators/')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'test-generator', type: ExerciseTestGeneratorEntity })
    async createTestGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTestGeneratorEntity
    ): Promise<ExerciseTestGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.createExtraFile(exercise_id, ExerciseTestGeneratorEntity, dto, file);
    }

    @Patch('/:id/test-generators/:file_id')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'test-generator', type: ExerciseTestGeneratorEntity })
    async updateTestGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTestGeneratorEntity
    ): Promise<ExerciseTestGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseTestGeneratorEntity, dto, file);
    }

    @Delete('/:id/test-generators/:file_id')
    async deleteTestGenerator(
        @User() user: any,
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseTestGeneratorEntity> {
        const accessLevel = await this.service.getAccessLevel(exercise_id, user.id);
        if (accessLevel < AccessLevel.CONTRIBUTOR) {
            throw new ForbiddenException(
                `You do not have sufficient privileges`);
        }
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseTestGeneratorEntity);
    }
}
