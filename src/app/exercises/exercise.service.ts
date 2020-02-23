import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

import { create, Archiver } from 'archiver';

import { AccessLevel } from '../permissions/entity/access-level.enum';
import { getAccessLevel } from '../_helpers/security/check-access-level';
import { GithubApiService } from '../github-api/github-api.service';
import { UserEntity } from '../user/entity/user.entity';
import { ExerciseEntity } from './entity/exercise.entity';

@Injectable()
export class ExerciseService extends TypeOrmCrudService<ExerciseEntity> {


    constructor(
        @InjectRepository(ExerciseEntity)
        protected readonly repository: Repository<ExerciseEntity>,

        protected readonly githubApiService: GithubApiService
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
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
                )
            );
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_path}${test.input.pathname}`, `${archive_base_path}${test_path}${test.input.pathname}`
                )
            );
            asyncArchiveWriters.push(
                this.addFileFromGithubToArchive(
                    user, exercise, archive, `${base_path}${test_path}${test.output.pathname}`, `${archive_base_path}${test_path}${test.output.pathname}`
                )
            );
        }
    }

    public async getAccessLevel(exercise_id: string, user_id: string): Promise<AccessLevel> {
        const access_level = await getAccessLevel(
            [
                { src_table: 'permission', dst_table: 'project', prop: 'project_id' },
                { src_table: 'project', dst_table: 'exercise', prop: 'exercises' }
            ],
            `exercise.id = '${exercise_id}' AND permission.user_id = '${user_id}'`
        );
        return access_level;
    }

    /* Private Methods */

    private async addFileFromGithubToArchive(
        user: UserEntity, exercise: ExerciseEntity, archive: Archiver, path: string, archive_path: string
    ): Promise<void> {

        const fileContents = await this.githubApiService.getFileContents(
            user, exercise.project_id, path
        );
        archive.append(
            Buffer.from(fileContents.content, 'base64'),
            { name: archive_path }
        );
    }
}
