import { Injectable } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import NodeCache = require('node-cache');

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ProjectEntity } from '../project/entity/project.entity';
import { ExerciseEntity } from '../exercises/entity/exercise.entity';

import { GithubClient } from './github-api.client';
import { FileCommitResponseDto, FileContentsDto, RepositoryDto } from './dto';

@Injectable()
export class GithubApiService {

    private logger = new AppLogger(GithubApiService.name);

    private client_cache: NodeCache = new NodeCache({ maxKeys: 100, stdTTL: 0 });

    constructor(
        readonly userService: UserService/*,
        @InjectRepository(ProjectEntity) protected readonly projectRepository: Repository<ProjectEntity> */) {
    }

    public async createProjectRepository(project: ProjectEntity): Promise<RepositoryDto> {
        try {
            this.logger.debug(`[createProjectRepository] Create Github repository ${project.id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const repo = await client.createRepository({
                name: project.id,
                private: !project.is_public,
                description: '[' + project.name + '] ' + project.description
            });
            if (!repo) {
                throw new Error('Failed to create Github repository.');
            }
            this.logger.debug(`[createProjectRepository] Github repository ${project.id} created`);
            return repo;
        } catch (err) {
            this.logger.error(
                `[createProjectRepository] Github repository ${project.id} not created, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async updateProjectRepository(project: ProjectEntity): Promise<RepositoryDto> {
        try {
            this.logger.debug(`[updateProjectRepository] Update Github repository ${project.id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const repo = await client.updateRepository(
                project.id, {
                    private: !project.is_public,
                    description: '[' + project.name + '] ' + project.description
                });
            if (!repo) {
                throw new Error('Failed to update Github repository.');
            }
            this.logger.debug(`[updateProjectRepository] Github repository ${project.id} updated`);
            return repo;
        } catch (err) {
            this.logger.error(
                `[updateProjectRepository] Github repository ${project.id} not updated, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteProjectRepository(project: ProjectEntity): Promise<void> {
        try {
            this.logger.debug(`[deleteProjectRepository] Delete Github repository ${project.id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            await client.deleteRepository(project.id);
            this.logger.debug(`[deleteProjectRepository] Github repository ${project.id} deleted`);
        } catch (err) {
            this.logger.error(
                `[deleteProjectRepository] Github repository ${project.id} not deleted, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async createOrUpdateExerciseTree(exercise: ExerciseEntity): Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[createOrUpdateExerciseTree] Create or update tree ${exercise.id} in Github repository \
                ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const user = await this.userService.findOne(exercise.owner_id);
            const result = await client.createOrUpdateFile(exercise.project_id, `${exercise.id}/metadata.json`, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                content: Buffer.from(JSON.stringify(classToPlain(exercise))).toString('base64'),
                sha: exercise.sha || undefined,
                message: `${exercise.sha ? 'Updated' : 'Created'} exercise ${exercise.id}`
            });
            if (!result) {
                throw new Error('Failed to create tree.');
            }
            this.logger.debug(`[createOrUpdateExerciseTree] Tree ${exercise.id} created/updated in Github repository \
                ${exercise.project_id}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[createOrUpdateExerciseTree] Tree ${exercise.id} not ${exercise.sha ? 'updated' : 'created'} in Github \
                    repository ${exercise.project_id}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteExerciseTree(exercise: ExerciseEntity): Promise<void> {
        try {
            this.logger.debug(`[deleteExerciseTree] Delete tree ${exercise.id} in Github repository \
                ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const user = await this.userService.findOne(exercise.owner_id);
            await client.deleteFolder(exercise.project_id, exercise.id, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                }
            });
            this.logger.debug(`[deleteExerciseTree] Tree ${exercise.id} deleted in Github repository \
                ${exercise.project_id}`);
        } catch (err) {
            this.logger.error(
                `[deleteExerciseTree] Tree ${exercise.id} not deleted in Github repository ${exercise.project_id}, \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async getExerciseFileContents(exercise: ExerciseEntity, pathname: string):
            Promise<FileContentsDto> {
        try {
            this.logger.debug(`[getExerciseFileContents] Get ${pathname} contents in ${exercise.id} \
                in Github repository ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const result = await client.getFileContents(
                exercise.project_id,
                pathname
            );
            if (!result) {
                throw new Error(`Failed to get ${pathname} contents`);
            }
            this.logger.debug(`[getExerciseFileContents] Contents of ${pathname} retrieved from Github \
                repository ${exercise.project_id}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[getExerciseFileContents] Contents of ${pathname} not retrieved from \
                    Github repository ${exercise.project_id}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async createExerciseFile(exercise: ExerciseEntity, type: string, file: any):
            Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[createExerciseFile] Create ${type} in ${exercise.id} \
                in Github repository ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const user = await this.userService.findOne(exercise.owner_id);
            const result = await client.createOrUpdateFile(
                exercise.project_id,
                `${exercise.id}/${type}/${file.originalname}`,
                {
                    author: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: `${user.email}`
                    },
                    commiter: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: `${user.email}`
                    },
                    content: file.buffer.toString('base64'),
                    message: `${type} in exercise ${exercise.id} created`
                }
            );
            if (!result) {
                throw new Error(`Failed to create ${type}`);
            }
            this.logger.debug(`[createExerciseFile] ${type} created in Github repository \
                ${exercise.project_id}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[createExerciseFile] File ${exercise.id}/${type}/${file.originalname} not created \
                    in Github repository ${exercise.project_id}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async updateExerciseFile(exercise: ExerciseEntity, file_entity: any, type: string, file: any, sha: string):
            Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[updateExerciseFile] Update ${type} in ${exercise.id} \
                in Github repository ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const user = await this.userService.findOne(exercise.owner_id);
            const new_path = `${exercise.id}/${type}/${file.originalname}`;
            if (file_entity.pathname !== new_path) {
                await this.deleteExerciseFile(exercise, file_entity);
            }
            const result = await client.createOrUpdateFile(
                exercise.project_id,
                new_path,
                {
                    author: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: `${user.email}`
                    },
                    commiter: {
                        name: `${user.first_name} ${user.last_name}`,
                        email: `${user.email}`
                    },
                    content: file.buffer.toString('base64'),
                    sha: file_entity.pathname !== new_path ? undefined : sha,
                    message: `${type} in exercise ${exercise.id} updated`
                }
            );
            if (!result) {
                throw new Error(`Failed to update ${type}`);
            }
            this.logger.debug(`[updateExerciseFile] ${type} updated in Github repository \
                ${exercise.project_id}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[updateExerciseFile] File ${exercise.id}/${type}/${file.originalname} not updated \
                    in Github repository ${exercise.project_id}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteExerciseFile(exercise: ExerciseEntity, file_entity: any):
            Promise<FileCommitResponseDto> {
        if (!file_entity.sha) {
            return null;
        }
        try {
            this.logger.debug(`[deleteExerciseFile] Delete file ${file_entity.pathname} in Github repository \
                ${exercise.project_id}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const user = await this.userService.findOne(exercise.owner_id);
            const result = await client.deleteFile(exercise.project_id, file_entity.pathname, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                sha: file_entity.sha,
                message: `Removed file ${file_entity.pathname}`
            });
            if (!result) {
                throw new Error('Failed to delete file.');
            }
            this.logger.debug(`[deleteExerciseFile] File ${file_entity.pathname} deleted in Github repository \
                ${exercise.project_id}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[deleteExerciseFile] File ${file_entity.pathname} not deleted in Github repository \
                    ${exercise.project_id}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async createFile(user: UserEntity, repo: string, path: string, content: string): Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[createFile] Create file ${path} in Github repository ${repo}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const result = await client.createOrUpdateFile(repo, path, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                content,
                message: `created file ${path}`
            });
            if (!result) {
                throw new Error('Failed to create file');
            }
            this.logger.debug(`[createFile] File ${path} created in Github repository ${repo}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[createFile] File ${path} not created in Github repository ${repo}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async updateFile(user: UserEntity, repo: string, path: string, sha: string, content: string): Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[updateFile] Update file ${path} in Github repository ${repo}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const result = await client.createOrUpdateFile(repo, path, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                content,
                message: `updated file ${path}`,
                sha
            });
            if (!result) {
                throw new Error('Failed to update file');
            }
            this.logger.debug(`[updateFile] File ${path} updated in Github repository ${repo}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[updateFile] File ${path} not updated in Github repository ${repo}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteFile(user: UserEntity, repo: string, path: string, sha: string): Promise<FileCommitResponseDto> {
        try {
            this.logger.debug(`[deleteFile] Delete file ${path} in Github repository ${repo}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const result = await client.deleteFile(repo, path, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                message: `deleted file ${path}`,
                sha
            });
            if (!result) {
                throw new Error('Failed to delete file');
            }
            this.logger.debug(`[deleteFile] File ${path} deleted in Github repository ${repo}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[deleteFile] File ${path} not deleted in Github repository ${repo}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async getFileContents(user: UserEntity, repo: string, path: string):
            Promise<FileContentsDto> {
        try {
            this.logger.debug(`[getFileContents] Get ${path} contents from Github repository ${repo}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            const result = await client.getFileContents(
                repo,
                path
            );
            if (!result) {
                throw new Error(`Failed to get ${path} contents`);
            }
            this.logger.debug(`[getFileContents] Contents of ${path} retrieved from Github repository ${repo}`);
            return result;
        } catch (err) {
            this.logger.error(
                `[getFileContents] Contents of ${path} not retrieved from Github repository ${repo}, \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteFolder(user: UserEntity, repo: string, path: string): Promise<void> {
        try {
            this.logger.debug(`[deleteFolder] Delete folder ${path} in Github repository ${repo}`);
            const client = await this.getClientForToken(config.githubApi.secret);
            await client.deleteFolder(repo, path, {
                author: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                },
                commiter: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: `${user.email}`
                }
            });
            this.logger.debug(`[deleteFolder] Folder ${path} deleted in Github repository ${repo}`);
        } catch (err) {
            this.logger.error(
                `[deleteFolder] Folder ${path} not deleted in Github repository ${repo}, because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private async getClientForToken(token: string): Promise<GithubClient> {
        let result: GithubClient = this.client_cache.get<GithubClient>(token);
        if (!result) {
            result = await GithubClient.createClient({ auth_token: token });
            this.client_cache.set<GithubClient>(
                token,
                result
            );
        }
        return result;
    }
}

