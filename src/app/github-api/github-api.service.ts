import { Injectable } from '@nestjs/common';
import NodeCache = require('node-cache');

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { ProjectEntity } from '../project/entity/project.entity';

import { GithubClient } from './github-api.client';
import { FileCommitResponseDto, FileContentsDto, RepositoryDto } from './dto';

@Injectable()
export class GithubApiService {

    private logger = new AppLogger(GithubApiService.name);

    private client_cache: NodeCache = new NodeCache({ maxKeys: 100, stdTTL: 0, useClones: false });

    constructor(
        readonly userService: UserService
    ) {
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

