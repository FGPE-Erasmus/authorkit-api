import {
    Post,
    HttpCode,
    HttpStatus,
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
    Query
} from '@nestjs/common';
import { ApiResponse, ApiUseTags, ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiImplicitBody } from '@nestjs/swagger';
import { CrudController, Override, ParsedBody, ParsedRequest, CrudRequest, Crud, CrudAuth } from '@nestjsx/crud';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { AppLogger } from '../app.logger';
import { RequestContext } from '../_helpers';
import {
    UseRoles,
    CrudOperationEnum,
    ResourcePossession,
    UseContextAccessEvaluator,
    AccessControlRequestInterceptor,
    ACGuard,
    AccessControlResponseInterceptor
} from '../access-control';
import { evaluateUserContextAccess } from '../project/security/project-context-access.evaluator';
import {
    ExerciseEntity,
    ExerciseDynamicCorrectorEntity,
    ExerciseEmbeddableEntity,
    ExerciseFeedbackGeneratorEntity,
    ExerciseInstructionEntity,
    ExerciseLibraryEntity,
    ExerciseSkeletonEntity,
    ExerciseSolutionEntity,
    ExerciseStatementEntity,
    ExerciseStaticCorrectorEntity,
    ExerciseTestGeneratorEntity,
    ExerciseTemplateEntity
} from './entity';
import { ExerciseService } from './exercise.service';
import { ExerciseCommand } from './exercise.command';
import { UserEntity } from 'app/user/entity/user.entity';

@Controller('exercises')
@ApiUseTags('exercises')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), ACGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Crud({
    model: {
        type: ExerciseEntity
    },
    routes: {
        getManyBase: {
            interceptors: [AccessControlResponseInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.LIST,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        getOneBase: {
            interceptors: [AccessControlResponseInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.READ,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        updateOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.PATCH,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        replaceOneBase: {
            interceptors: [AccessControlRequestInterceptor],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.UPDATE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ]
        },
        deleteOneBase: {
            interceptors: [],
            decorators: [
                UseRoles({
                    resource: 'exercise',
                    action: CrudOperationEnum.DELETE,
                    possession: ResourcePossession.ANY
                }),
                UseContextAccessEvaluator(evaluateUserContextAccess)
            ],
            returnDeleted: true
        }
    },
    query: {
        join: {
            /* 'projects': {
                alias: 'project_id'
            },
            'projects.permissions': {
                eager: true
            } */
            'instructions': {
                eager: true
            },
            'statements': {
                eager: true
            },
            'embeddables': {
                eager: true
            },
            'skeletons': {
                eager: true
            },
            'libraries': {
                eager: true
            },
            'static_correctors': {
                eager: true
            },
            'dynamic_correctors': {
                eager: true
            },
            'solutions': {
                eager: true
            },
            'templates': {
                eager: true
            },
            'tests': {
                eager: true
            },
            'test_sets': {
                eager: true
            },
            'test_generators': {
                eager: true
            },
            'feedback_generators': {
                eager: true
            }
        }
    }
})
/* @CrudAuth({
    property: 'user',
    filter: (user: UserEntity) => ({
        $or: [
            { 'owner_id': user.id },
            { 'projects.permissions.user_id': user.id }
        ]
    })
}) */
export class ExerciseController implements CrudController<ExerciseEntity> {

    private logger = new AppLogger(ExerciseController.name);

    constructor(
        readonly service: ExerciseService,
        readonly exerciseCmd: ExerciseCommand
    ) { }

    get base(): CrudController<ExerciseEntity> {
        return this;
    }

    @Post('import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'NO CONTENT' })
    public async import(): Promise<void> {
        this.logger.silly(`[importExercises] execute `);
        return this.exerciseCmd.create(20);
    }

    @Override()
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.CREATE,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(AccessControlRequestInterceptor)
    createOne(
        @ParsedRequest() req: CrudRequest,
        @ParsedBody() dto: ExerciseEntity
    ) {
        if (!dto.owner_id) {
            dto.owner_id = RequestContext.currentUser().id;
        }
        return this.base.createOneBase(req, dto);
    }

    /* Extra Files */

    @Get('/:id/files/read')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.READ,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async getFeedbackGenerator(
        @Param('id') exercise_id: string,
        @Query('pathname') pathname: string
    ): Promise<string> {
        return this.service.getExtraFileContents(exercise_id, pathname);
    }

    // dynamic corrector

    @Post('/:id/dynamic-correctors/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'dynamic-corrector', type: ExerciseDynamicCorrectorEntity })
    async createDynamicCorrector(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseDynamicCorrectorEntity
    ): Promise<ExerciseDynamicCorrectorEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseDynamicCorrectorEntity, dto, file);
    }

    @Patch('/:id/dynamic-correctors/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'dynamic-corrector', type: ExerciseDynamicCorrectorEntity })
    async updateDynamicCorrector(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseDynamicCorrectorEntity
    ): Promise<ExerciseDynamicCorrectorEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseDynamicCorrectorEntity, dto, file);
    }

    @Delete('/:id/dynamic-correctors/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteDynamicCorrector(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseDynamicCorrectorEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseDynamicCorrectorEntity);
    }


    // embeddable

    @Post('/:id/embeddables/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'embeddable', type: ExerciseEmbeddableEntity })
    async createEmbeddable(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseEmbeddableEntity
    ): Promise<ExerciseEmbeddableEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseEmbeddableEntity, dto, file);
    }

    @Patch('/:id/embeddables/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'embeddable', type: ExerciseEmbeddableEntity })
    async updateEmbeddable(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseEmbeddableEntity
    ): Promise<ExerciseEmbeddableEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseEmbeddableEntity, dto, file);
    }

    @Delete('/:id/embeddables/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteEmbeddable(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseEmbeddableEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseEmbeddableEntity);
    }


    // feedback generator

    @Post('/:id/feedback-generators/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'feedback-generator', type: ExerciseFeedbackGeneratorEntity })
    async createFeedbackGenerator(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseFeedbackGeneratorEntity
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseFeedbackGeneratorEntity, dto, file);
    }

    @Patch('/:id/feedback-generators/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'feedback-generator', type: ExerciseFeedbackGeneratorEntity })
    async updateFeedbackGenerator(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseFeedbackGeneratorEntity
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseFeedbackGeneratorEntity, dto, file);
    }

    @Delete('/:id/feedback-generators/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteFeedbackGenerator(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseFeedbackGeneratorEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseFeedbackGeneratorEntity);
    }

    // instruction

    @Post('/:id/instructions/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: ExerciseInstructionEntity })
    async createInstruction(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseInstructionEntity
    ): Promise<ExerciseInstructionEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseInstructionEntity, dto, file);
    }

    @Patch('/:id/instructions/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'instruction', type: ExerciseInstructionEntity })
    async updateInstruction(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseInstructionEntity
    ): Promise<ExerciseInstructionEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseInstructionEntity, dto, file);
    }

    @Delete('/:id/instructions/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteInstruction(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseInstructionEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseInstructionEntity);
    }

    // library

    @Post('/:id/libraries/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'library', type: ExerciseLibraryEntity })
    async createLibrary(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseLibraryEntity
    ): Promise<ExerciseLibraryEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseLibraryEntity, dto, file);
    }

    @Patch('/:id/libraries/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'library', type: ExerciseLibraryEntity })
    async updateLibrary(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseLibraryEntity
    ): Promise<ExerciseLibraryEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseLibraryEntity, dto, file);
    }

    @Delete('/:id/libraries/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteLibrary(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseLibraryEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseLibraryEntity);
    }


    // skeleton

    @Post('/:id/skeletons/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'skeleton', type: ExerciseSkeletonEntity })
    async createSkeleton(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSkeletonEntity
    ): Promise<ExerciseSkeletonEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseSkeletonEntity, dto, file);
    }

    @Patch('/:id/skeletons/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'skeleton', type: ExerciseSkeletonEntity })
    async updateSkeleton(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSkeletonEntity
    ): Promise<ExerciseSkeletonEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseSkeletonEntity, dto, file);
    }

    @Delete('/:id/skeletons/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteSkeleton(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseSkeletonEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseSkeletonEntity);
    }


    // solution

    @Post('/:id/solutions/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'solution', type: ExerciseSolutionEntity })
    async createSolution(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSolutionEntity
    ): Promise<ExerciseSolutionEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseSolutionEntity, dto, file);
    }

    @Patch('/:id/solutions/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'solution', type: ExerciseSolutionEntity })
    async updateSolution(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseSolutionEntity
    ): Promise<ExerciseSolutionEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseSolutionEntity, dto, file);
    }

    @Delete('/:id/solutions/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteSolution(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseSolutionEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseSolutionEntity);
    }


    // statement

    @Post('/:id/statements/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'statement', type: ExerciseStatementEntity })
    async createStatement(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStatementEntity
    ): Promise<ExerciseStatementEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseStatementEntity, dto, file);
    }

    @Patch('/:id/statements/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'statement', type: ExerciseStatementEntity })
    async updateStatement(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStatementEntity
    ): Promise<ExerciseStatementEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseStatementEntity, dto, file);
    }

    @Delete('/:id/statements/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteStatement(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseStatementEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseStatementEntity);
    }


    // static corrector

    @Post('/:id/static-correctors/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'static-corrector', type: ExerciseStaticCorrectorEntity })
    async createStaticCorrector(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStaticCorrectorEntity
    ): Promise<ExerciseStaticCorrectorEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseStaticCorrectorEntity, dto, file);
    }

    @Patch('/:id/static-correctors/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'static-corrector', type: ExerciseStaticCorrectorEntity })
    async updateStaticCorrector(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseStaticCorrectorEntity
    ): Promise<ExerciseStaticCorrectorEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseStaticCorrectorEntity, dto, file);
    }

    @Delete('/:id/static-correctors/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteStaticCorrector(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseStaticCorrectorEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseStaticCorrectorEntity);
    }


    // template

    @Post('/:id/templates/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'template', type: ExerciseTemplateEntity })
    async createTemplate(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTemplateEntity
    ): Promise<ExerciseTemplateEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseTemplateEntity, dto, file);
    }

    @Patch('/:id/templates/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'template', type: ExerciseTemplateEntity })
    async updateTemplate(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTemplateEntity
    ): Promise<ExerciseTemplateEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseTemplateEntity, dto, file);
    }

    @Delete('/:id/templates/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteTemplate(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseTemplateEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseTemplateEntity);
    }


    // test generator

    @Post('/:id/test-generators/')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'test-generator', type: ExerciseTestGeneratorEntity })
    async createTestGenerator(
        @Param('id') exercise_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTestGeneratorEntity
    ): Promise<ExerciseTestGeneratorEntity> {
        return this.service.createExtraFile(exercise_id, ExerciseTestGeneratorEntity, dto, file);
    }

    @Patch('/:id/test-generators/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiImplicitFile({ name: 'file', required: true })
    @ApiImplicitBody({ name: 'test-generator', type: ExerciseTestGeneratorEntity })
    async updateTestGenerator(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string,
        @UploadedFile() file,
        @Body() dto: ExerciseTestGeneratorEntity
    ): Promise<ExerciseTestGeneratorEntity> {
        return this.service.updateExtraFile(exercise_id, file_id, ExerciseTestGeneratorEntity, dto, file);
    }

    @Delete('/:id/test-generators/:file_id')
    @UseRoles({
        resource: 'exercise',
        action: CrudOperationEnum.PATCH,
        possession: ResourcePossession.ANY
    })
    @UseContextAccessEvaluator(evaluateUserContextAccess)
    async deleteTestGenerator(
        @Param('id') exercise_id: string,
        @Param('file_id') file_id: string
    ): Promise<ExerciseTestGeneratorEntity> {
        return this.service.deleteExtraFile(exercise_id, file_id, ExerciseTestGeneratorEntity);
    }

}
