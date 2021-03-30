import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { Archiver, create } from 'archiver';
import { Open } from 'unzipper';
import { Parser } from 'xml2js';
import * as stream from 'stream';
import { yapexil2mefStream } from 'yapexil-mef-converter';

import { AppLogger } from '../app.logger';
import { AccessLevel } from '../permissions/entity/access-level.enum';
import { TextFormat } from '../_helpers';
import { DeepPartial } from '../_helpers/database/deep-partial';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { DynamicCorrectorService } from '../dynamic-correctors/dynamic-corrector.service';
import { EmbeddableService } from '../embeddables/embeddable.service';
import { FeedbackGeneratorService } from '../feedback-generators/feedback-generator.service';
import { InstructionService } from '../instructions/instruction.service';
import { LibraryService } from '../libraries/library.service';
import { SkeletonService } from '../skeletons/skeleton.service';
import { SolutionService } from '../solutions/solution.service';
import { StatementService } from '../statements/statement.service';
import { StaticCorrectorService } from '../static-correctors/static-corrector.service';
import { TemplateService } from '../templates/template.service';
import { TestGeneratorService } from '../test-generators/test-generator.service';
import { TestService } from '../tests/test.service';
import { TestSetService } from '../testsets/testset.service';
import { fileExtension, languageName } from '../_helpers/utils';

import { ExerciseEntity } from './entity/exercise.entity';
import { EXERCISE_SYNC_CREATE, EXERCISE_SYNC_QUEUE } from './exercise.constants';
import { ExerciseType } from './entity/exercise-type.enum';
import { ExerciseDifficulty } from './entity/exercise-difficulty.enum';
import { ExerciseStatus } from './entity/exercise-status.enum';

@Injectable()
export class ExerciseService extends TypeOrmCrudService<ExerciseEntity> {

    private logger = new AppLogger(ExerciseService.name);

    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,

        @InjectQueue(EXERCISE_SYNC_QUEUE) private readonly exerciseSyncQueue: Queue,

        protected readonly githubApiService: GithubApiService,

        protected readonly dynamicCorrectorService: DynamicCorrectorService,
        protected readonly embeddableService: EmbeddableService,
        protected readonly feedbackGeneratorService: FeedbackGeneratorService,
        protected readonly instructionService: InstructionService,
        protected readonly libraryService: LibraryService,
        protected readonly skeletonService: SkeletonService,
        protected readonly solutionService: SolutionService,
        protected readonly statementService: StatementService,
        protected readonly staticCorrectorService: StaticCorrectorService,
        protected readonly templateService: TemplateService,
        protected readonly testGeneratorService: TestGeneratorService,
        protected readonly testService: TestService,
        protected readonly testsetsService: TestSetService
    ) {
        super(repository);
    }

    public async getOne(req: CrudRequest): Promise<ExerciseEntity> {
        return super.getOne(req);
    }

    public async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<ExerciseEntity> | ExerciseEntity[]> {
        return super.getMany(req);
    }

    public async createOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        return await super.createOne(req, dto);
    }

    public async updateOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        return await super.updateOne(req, dto);
    }

    public async replaceOne(req: CrudRequest, dto: ExerciseEntity): Promise<ExerciseEntity> {
        return await super.replaceOne(req, dto);
    }

    public async deleteOne(req: CrudRequest): Promise<ExerciseEntity | void> {
        return super.deleteOne(req);
    }

    public async import(
        user: UserEntity, project_id: string, input: any
    ): Promise<ExerciseEntity> {

        const directory = await Open.buffer(input.buffer);

        return await this.importProcessEntries(
            user,
            project_id,
            directory.files.reduce(
                (obj, item) => Object.assign(obj, { [item.path]: item }), {}
            )
        );
    }

    public async importProcessEntries(
        user: UserEntity, project_id: string, entries: any
    ): Promise<ExerciseEntity> {
        const root_metadata = entries['metadata.json'];
        if (!root_metadata) {
            this.throwBadRequestException('Archive misses required metadata');
        }

        const exercise = await this.importMetadataFile(user, project_id, root_metadata);

        await this.exerciseSyncQueue.add(EXERCISE_SYNC_CREATE, { user, exercise });

        const result = Object.keys(entries).reduce(function(acc, curr) {
            const match = curr.match('^([a-zA-Z-]+)/([0-9a-zA-Z-]+)/(.*)$');
            if (!match || !acc[match[1]]) {
                return acc;
            }
            if (!acc[match[1]][match[2]]) {
                acc[match[1]][match[2]] = {};
            }
            acc[match[1]][match[2]][match[3]] = entries[curr];
            return acc;
        }, {
            'dynamic-correctors': [],
            'embeddables': [],
            'feedback-generators': [],
            'instructions': [],
            'libraries': [],
            'skeletons': [],
            'solutions': [],
            'statements': [],
            'static-correctors': [],
            'templates': [],
            'test-generators': [],
            'tests': [],
            'testsets': []
        });

        const asyncImporters = [];

        Object.keys(result['dynamic-correctors']).forEach(related_entity_key => {
            asyncImporters.push(
                this.dynamicCorrectorService.importProcessEntries(
                    user, exercise, result['dynamic-correctors'][related_entity_key]
                )
            );
        });

        Object.keys(result['embeddables']).forEach(related_entity_key => {
            asyncImporters.push(
                this.embeddableService.importProcessEntries(
                    user, exercise, result['embeddables'][related_entity_key]
                )
            );
        });

        Object.keys(result['feedback-generators']).forEach(related_entity_key => {
            asyncImporters.push(
                this.feedbackGeneratorService.importProcessEntries(
                    user, exercise, result['feedback-generators'][related_entity_key]
                )
            );
        });

        Object.keys(result['instructions']).forEach(related_entity_key => {
            asyncImporters.push(
                this.instructionService.importProcessEntries(
                    user, exercise, result['instructions'][related_entity_key]
                )
            );
        });

        Object.keys(result['libraries']).forEach(related_entity_key => {
            asyncImporters.push(
                this.libraryService.importProcessEntries(
                    user, exercise, result['libraries'][related_entity_key]
                )
            );
        });

        Object.keys(result['skeletons']).forEach(related_entity_key => {
            asyncImporters.push(
                this.skeletonService.importProcessEntries(
                    user, exercise, result['skeletons'][related_entity_key]
                )
            );
        });

        Object.keys(result['solutions']).forEach(related_entity_key => {
            asyncImporters.push(
                this.solutionService.importProcessEntries(
                    user, exercise, result['solutions'][related_entity_key]
                )
            );
        });

        Object.keys(result['statements']).forEach(related_entity_key => {
            asyncImporters.push(
                this.statementService.importProcessEntries(
                    user, exercise, result['statements'][related_entity_key]
                )
            );
        });

        Object.keys(result['static-correctors']).forEach(related_entity_key => {
            asyncImporters.push(
                this.staticCorrectorService.importProcessEntries(
                    user, exercise, result['static-correctors'][related_entity_key]
                )
            );
        });

        Object.keys(result['templates']).forEach(related_entity_key => {
            asyncImporters.push(
                this.templateService.importProcessEntries(
                    user, exercise, result['templates'][related_entity_key]
                )
            );
        });

        Object.keys(result['test-generators']).forEach(related_entity_key => {
            asyncImporters.push(
                this.testGeneratorService.importProcessEntries(
                    user, exercise, result['test-generators'][related_entity_key]
                )
            );
        });

        Object.keys(result['tests']).forEach(related_entity_key => {
            asyncImporters.push(
                this.testService.importProcessEntries(
                    user, exercise, result['tests'][related_entity_key]
                )
            );
        });

        Object.keys(result['testsets']).forEach(related_entity_key => {
            asyncImporters.push(
                this.testsetsService.importProcessEntries(
                    user, exercise, result['testsets'][related_entity_key]
                )
            );
        });

        await Promise.all(asyncImporters);

        return exercise;
    }

    public async importMetadataFile(
        user: UserEntity, project_id: string, metadataFile: any
    ): Promise<ExerciseEntity> {

        const metadata = JSON.parse((await metadataFile.buffer()).toString());

        const exercise: DeepPartial<ExerciseEntity> = {
            title: metadata.title,
            module: metadata.module,
            owner_id: user.id,
            keywords: metadata.keywords,
            type: metadata.type,
            difficulty: metadata.difficulty,
            event: metadata.event,
            platform: metadata.platform,
            status: metadata.status,
            project_id
        };

        return await this.repository.save(exercise);
    }

    public async importSipe(
        user: UserEntity, project_id: string, sipeFile: any
    ): Promise<ExerciseEntity[]> {

       const sipe = JSON.parse(sipeFile.buffer.toString('utf8'));

       const asyncImporters = [];

       sipe.forEach(singleSipe => {
           asyncImporters.push(
               this.importSipeSingle(user, project_id, singleSipe)
           );
       });

       await Promise.all(asyncImporters);

       return sipe;
    }

    public async importSipeSingle(
        user: UserEntity, project_id: string, sipe: any
    ): Promise<ExerciseEntity> {

        const exercisePartial: DeepPartial<ExerciseEntity> = {
            title: sipe.title,
            module: sipe.module,
            owner_id: user.id,
            keywords: [],
            type: ExerciseType.BLANK_SHEET,
            difficulty: ExerciseDifficulty.EASY,
            platform: 'Python',
            status: ExerciseStatus.DRAFT,
            project_id
        };

        const exercise = await this.repository.save(exercisePartial);

        await this.exerciseSyncQueue.add(EXERCISE_SYNC_CREATE, { user, exercise });

        const asyncImporters = [];

        asyncImporters.push(
            this.statementService.importProcessEntries(
                user, exercise, {
                    'metadata.json': {
                        buffer: () => Buffer.from(JSON.stringify({
                            pathname: 'ex.txt',
                            format: TextFormat.TXT,
                            nat_lang: 'pl'
                        }), 'utf8')
                    },
                    'ex.txt': {
                        buffer: () => Buffer.from(sipe.task, 'utf8')
                    }
                }
            )
        );
        asyncImporters.push(
            this.skeletonService.importProcessEntries(
                user, exercise, {
                    'metadata.json': {
                        buffer: () => Buffer.from(JSON.stringify({
                            pathname: 'in.py',
                            lang: 'python'
                        }), 'utf8')
                    },
                    'in.py': {
                        buffer: () => Buffer.from(sipe.initcode, 'utf8')
                    }
                }
            )
        );
        asyncImporters.push(
            this.staticCorrectorService.importProcessEntries(
                user, exercise, {
                    'metadata.json': {
                        buffer: () => Buffer.from(JSON.stringify({
                            pathname: 'vrules.ecl',
                            command_line: ''
                        }), 'utf8')
                    },
                    'vrules.ecl': {
                        buffer: () => Buffer.from(sipe.inputReq, 'utf8')
                    }
                }
            )
        );
        asyncImporters.push(
            this.dynamicCorrectorService.importProcessEntries(
                user, exercise, {
                    'metadata.json': {
                        buffer: () => Buffer.from(JSON.stringify({
                            pathname: 'inout.ecl',
                            command_line: ''
                        }), 'utf8')
                    },
                    'inout.ecl': {
                        buffer: () => Buffer.from(sipe.outputHas, 'utf8')
                    }
                }
            )
        );

        await Promise.all(asyncImporters);

        return exercise;
    }

    public async importMef(
        user: UserEntity, project_id: string, mefFile: any
    ): Promise<ExerciseEntity> {

        const directory = await Open.buffer(mefFile.buffer);
        const entries = directory.files.reduce((obj, item) => {
            obj[item.path] = item;
            return obj;
        }, {});

        const baseFile = entries['Content.xml'];
        if (!baseFile) {
            this.throwBadRequestException('Archive misses required "Content.xml"');
        }

        const parser: Parser = new Parser();

        let baseJson;
        try {
            baseJson = await parser.parseStringPromise(
                (await baseFile.buffer()).toString('utf8')
            );
        } catch (error) {
            throw error;
        }

        // create exercise
        const exercise: ExerciseEntity = await this.importMefCreateExercise(user, project_id, baseJson.Problem.$);

        await this.exerciseSyncQueue.add(EXERCISE_SYNC_CREATE, { user, exercise });

        const asyncImporters = [];

        if (baseJson.Problem.$.Description && entries[baseJson.Problem.$.Description]) {
            asyncImporters.push(
                this.statementService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: baseJson.Problem.$.Description,
                                format: TextFormat.HTML,
                                nat_lang: 'pt'
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.Description]: {
                            buffer: entries[baseJson.Problem.$.Description].buffer
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.$.PDF && entries[baseJson.Problem.$.PDF]) {
            asyncImporters.push(
                this.statementService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: baseJson.Problem.$.PDF,
                                format: TextFormat.PDF,
                                nat_lang: 'pt'
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.PDF]: {
                            buffer: entries[baseJson.Problem.$.PDF].buffer
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.$.Static_corrector) {
            asyncImporters.push(
                this.staticCorrectorService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: 'corrector.sh',
                                command_line: baseJson.Problem.$.Static_corrector
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.Static_corrector]: {
                            buffer: Buffer.from('', 'utf8')
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.$.Dynamic_corrector) {
            asyncImporters.push(
                this.dynamicCorrectorService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: 'corrector.sh',
                                command_line: baseJson.Problem.$.Dynamic_corrector
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.Dynamic_corrector]: {
                            buffer: Buffer.from('', 'utf8')
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.$.Environment && entries[baseJson.Problem.$.Environment]) {
            asyncImporters.push(
                this.libraryService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: 'corrector.sh',
                                command_line: baseJson.Problem.$.Environment
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.Environment]: {
                            buffer: Buffer.from('', 'utf8')
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.$.Program && entries[baseJson.Problem.$.Program]) {
            asyncImporters.push(
                this.solutionService.importProcessEntries(
                    user, exercise, {
                        'metadata.json': {
                            buffer: () => Buffer.from(JSON.stringify({
                                pathname: baseJson.Problem.$.Program,
                                lang: languageName(fileExtension(baseJson.Problem.$.Program))
                            }), 'utf8')
                        },
                        [baseJson.Problem.$.Program]: {
                            buffer: entries[baseJson.Problem.$.Program].buffer
                        }
                    }
                )
            );
        }

        if (baseJson.Problem.Solutions) {
            Object.keys(entries)
                .filter(path => path.startsWith('solutions'))
                .forEach(path => {
                    const solutionName = path.substring('solutions'.length + 1);
                    if (!solutionName) {
                        return;
                    }
                    asyncImporters.push(
                        this.solutionService.importProcessEntries(
                            user, exercise, {
                                'metadata.json': {
                                    buffer: () => Buffer.from(JSON.stringify({
                                        pathname: solutionName,
                                        lang: languageName(fileExtension(solutionName))
                                    }), 'utf8')
                                },
                                [solutionName]: {
                                    buffer: entries[path].buffer
                                }
                            }
                        )
                    );
                });
        }

        if (baseJson.Problem.Skeletons) {
            Object.keys(entries)
                .filter(path => path.startsWith('skeletons'))
                .forEach(path => {
                    const skeletonName = path.substring('skeletons'.length + 1);
                    if (!skeletonName) {
                        return;
                    }
                    asyncImporters.push(
                        this.skeletonService.importProcessEntries(
                            user, exercise, {
                                'metadata.json': {
                                    buffer: () => Buffer.from(JSON.stringify({
                                        pathname: skeletonName,
                                        lang: languageName(fileExtension(skeletonName))
                                    }), 'utf8')
                                },
                                [skeletonName]: {
                                    buffer: entries[path].buffer
                                }
                            }
                        )
                    );
                });
        }

        if (baseJson.Problem.Images) {
            Object.keys(entries)
                .filter(path => path.startsWith('images'))
                .forEach(path => {
                    const imageName = path.substring('images'.length + 1);
                    if (!imageName) {
                        return;
                    }
                    asyncImporters.push(
                        this.embeddableService.importProcessEntries(
                            user, exercise, {
                                'metadata.json': {
                                    buffer: () => Buffer.from(JSON.stringify({
                                        pathname: imageName
                                    }), 'utf8')
                                },
                                [imageName]: {
                                    buffer: entries[path].buffer
                                }
                            }
                        )
                    );
                });
        }

        if (baseJson.Problem.Tests && baseJson.Problem.Tests[0] && baseJson.Problem.Tests[0].Test) {
            baseJson.Problem.Tests[0].Test.forEach(test => {
                const inputPath = test.$['xml:id'].replace('tests.', 'tests/') + '/' + test.$.input;
                const outputPath = test.$['xml:id'].replace('tests.', 'tests/') + '/' + test.$.output;
                const timeout = test.$.Timeout ? test.$.Timeout : baseJson.Problem.$.Timeout;
                const args = [];
                if (test.$.args) {
                    args.push(test.$.args);
                }
                if (timeout && timeout > 0) {
                    args.push('--timeout');
                    args.push(timeout);
                }
                asyncImporters.push(
                    this.testService.importProcessEntries(
                        user, exercise, {
                            'metadata.json': {
                                buffer: () => Buffer.from(JSON.stringify({
                                    input: test.$.input,
                                    output: test.$.output,
                                    weight: test.$.Points ? parseInt(test.$.Points, 10) : 0,
                                    visible: test.$.Show === 'yes',
                                    arguments: args
                                }), 'utf8')
                            },
                            [test.$.input]: {
                                buffer: entries[inputPath].buffer
                            },
                            [test.$.output]: {
                                buffer: entries[outputPath].buffer
                            }
                        }
                    )
                );
            });
        }

        await Promise.all(asyncImporters);

        return exercise;
    }

    public async importMefCreateExercise(user: UserEntity, project_id: string, metadata: any): Promise<ExerciseEntity> {

        const exercise: DeepPartial<ExerciseEntity> = {
            title: `[${metadata.Name}] ${metadata.Title}`,
            module: metadata.Type,
            owner_id: user.id,
            keywords: ['Mooshak'],
            type: ExerciseType.BLANK_SHEET,
            event: '',
            platform: 'Mooshak',
            status: ExerciseStatus.DRAFT,
            project_id
        };

        if (metadata.Difficulty === 'Very Easy') {
            exercise.difficulty = ExerciseDifficulty.BEGINNER;
        } else if (metadata.Difficulty === 'Easy') {
            exercise.difficulty = ExerciseDifficulty.EASY;
        } else if (metadata.Difficulty === 'Medium') {
            exercise.difficulty = ExerciseDifficulty.AVERAGE;
        } else if (metadata.Difficulty === 'Difficult') {
            exercise.difficulty = ExerciseDifficulty.HARD;
        } else if (metadata.Difficulty === 'Very Difficult') {
            exercise.difficulty = ExerciseDifficulty.MASTER;
        }

        if (metadata.Type) {
            exercise.keywords.push(metadata.Type);
        }

        return await this.repository.save(exercise);
    }

    public async export(
        user: UserEntity, exercise_id: string, format: string = 'zip', res: any
    ): Promise<void> {

        const archive: Archiver = create(format);

        archive.pipe(res);

        archive.on('error', function(err) {
            throw err;
        });

        const asyncArchiveWriters = [];

        await this.collectAllToExport(user, exercise_id, archive, asyncArchiveWriters, '');

        await Promise.all(asyncArchiveWriters);

        await archive.finalize();
    }

    public async exportMef(
        user: UserEntity, exercise_id: string, format: string = 'zip', res: any
    ): Promise<void> {

        const pass = new stream.PassThrough();

        await this.export(user, exercise_id, format, pass);

        return yapexil2mefStream(pass, res);
    }

    public async collectAllToExport(
        user: UserEntity, exercise_id: string, archive: Archiver, asyncArchiveWriters: any[], archive_base_path: string
    ): Promise<void> {

        const exercise: ExerciseEntity = await this.findOne(exercise_id);

        const base_path = `exercises/${exercise.id}/`;

        asyncArchiveWriters.push(
            this.addFileFromGithubToArchive(user, exercise, archive, `${base_path}metadata.json`, `${archive_base_path}metadata.json`)
        );

        for (const dynamic_corrector of exercise.dynamic_correctors) {
            const dynamic_corrector_path = `dynamic-correctors/${dynamic_corrector.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${dynamic_corrector_path}metadata.json`, `${archive_base_path}${dynamic_corrector_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${dynamic_corrector_path}${dynamic_corrector.pathname}`, `${archive_base_path}${dynamic_corrector_path}${dynamic_corrector.pathname}`
                )
            );
        }

        for (const static_corrector of exercise.static_correctors) {
            const static_corrector_path = `static-correctors/${static_corrector.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${static_corrector_path}metadata.json`, `${archive_base_path}${static_corrector_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${static_corrector_path}${static_corrector.pathname}`, `${archive_base_path}${static_corrector_path}${static_corrector.pathname}`
                )
            );
        }

        for (const embeddable of exercise.embeddables) {
            const embeddable_path = `embeddables/${embeddable.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${embeddable_path}metadata.json`, `${archive_base_path}${embeddable_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${embeddable_path}${embeddable.pathname}`, `${archive_base_path}${embeddable_path}${embeddable.pathname}`
                )
            );
        }

        for (const feedback_generator of exercise.feedback_generators) {
            const feedback_generator_path = `feedback-generators/${feedback_generator.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${feedback_generator_path}metadata.json`, `${archive_base_path}${feedback_generator_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${feedback_generator_path}${feedback_generator.pathname}`, `${archive_base_path}${feedback_generator_path}${feedback_generator.pathname}`
                )
            );
        }

        for (const instruction of exercise.instructions) {
            const instruction_path = `instructions/${instruction.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${instruction_path}metadata.json`, `${archive_base_path}${instruction_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${instruction_path}${instruction.pathname}`, `${archive_base_path}${instruction_path}${instruction.pathname}`
                )
            );
        }

        for (const library of exercise.libraries) {
            const library_path = `libraries/${library.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${library_path}metadata.json`, `${archive_base_path}${library_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${library_path}${library.pathname}`, `${archive_base_path}${library_path}${library.pathname}`
                )
            );
        }

        for (const skeleton of exercise.skeletons) {
            const skeleton_path = `skeletons/${skeleton.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${skeleton_path}metadata.json`, `${archive_base_path}${skeleton_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${skeleton_path}${skeleton.pathname}`, `${archive_base_path}${skeleton_path}${skeleton.pathname}`
                )
            );
        }

        for (const solution of exercise.solutions) {
            const solution_path = `solutions/${solution.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${solution_path}metadata.json`, `${archive_base_path}${solution_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${solution_path}${solution.pathname}`, `${archive_base_path}${solution_path}${solution.pathname}`
                )
            );
        }

        for (const statement of exercise.statements) {
            const statement_path = `statements/${statement.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${statement_path}metadata.json`, `${archive_base_path}${statement_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${statement_path}${statement.pathname}`, `${archive_base_path}${statement_path}${statement.pathname}`
                )
            );
        }

        for (const template of exercise.templates) {
            const template_path = `templates/${template.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${template_path}metadata.json`, `${archive_base_path}${template_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${template_path}${template.pathname}`, `${archive_base_path}${template_path}${template.pathname}`
                )
            );
        }

        for (const test_generator of exercise.test_generators) {
            const test_generator_path = `test-generators/${test_generator.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_generator_path}metadata.json`, `${archive_base_path}${test_generator_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_generator_path}${test_generator.pathname}`, `${archive_base_path}${test_generator_path}${test_generator.pathname}`
                )
            );
        }

        for (const test_set of exercise.test_sets) {
            const test_set_path = `testsets/${test_set.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_set_path}metadata.json`, `${archive_base_path}${test_set_path}metadata.json`
                )
            );
        }

        for (const test of exercise.tests) {
            let test_path = '';
            if (test.testset_id) {
                test_path += `testsets/${test.testset_id}/`;
            }
            test_path += `tests/${test.id}/`;
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_path}metadata.json`, `${archive_base_path}${test_path}metadata.json`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_path}${test.input.pathname}`, `${archive_base_path}${test_path}${test.input.pathname}`
                ),
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_path}${test.output.pathname}`, `${archive_base_path}${test_path}${test.output.pathname}`
                )
            );
        }
    }

    public async getAccessLevel(exercise_id: string, user_id: string): Promise<AccessLevel> {
        return await getAccessLevel(
            [
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' }
            ],
            `exercise.id = '${exercise_id}'`,
            `permission.user_id = '${user_id}'`
        );
    }

    /* Private Methods */

    private async addFileFromGithubToArchive(
        user: UserEntity,
        exercise: ExerciseEntity,
        archive: Archiver,
        path: string,
        archive_path: string
    ): Promise<void> {

        try {
            const contents = await this.githubApiService.getFileContents(
                user, exercise.project_id, path
            );
            if (!contents || !contents.content) {
                return;
            }
            archive.append(
                Buffer.from(contents.content, 'base64'),
                { name: archive_path }
            );
        } catch (error) {
            // just log error
            this.logger.log(error);
        }
    }
}
