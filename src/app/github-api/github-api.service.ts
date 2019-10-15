import { HttpService, Injectable, InternalServerErrorException } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';
const Octokit = require('@octokit/rest');

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { CreateRepoDto, Repository, UpdateRepoDto, FileCommitDto, FileCommitResponseDto } from './dto';

@Injectable()
export class GithubApiService {

    private logger = new AppLogger(GithubApiService.name);

    private octokit = new Octokit({
        auth: config.githubApi.secret
    });

    constructor(private httpService: HttpService) {
    }

    public async createRepository(options: CreateRepoDto): Promise<Repository> {
        try {
            return await this.octokit.repos
                .createForAuthenticatedUser(options)
                .pipe(map((data) => plainToClass(
                    Repository,
                    data,
                    { strategy: 'excludeAll' })
                ))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException('Failed to create Github repository');
        }
    }

    public async getRepository(owner: string, repo: string): Promise<Repository> {
        try {
            return await this.octokit.repos
                .get({ owner, repo})
                .pipe(map((data) => plainToClass(
                    Repository,
                    data,
                    { strategy: 'excludeAll' })
                ))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException(
                `Failed to retrieve Github repository "${repo}" of "${owner}"`);
        }
    }

    public async updateRepository(owner: string, repo: string, options: UpdateRepoDto): Promise<Repository> {
        try {
            return await this.octokit.repos
                .update({ owner, repo, ...options })
                .pipe(map((data) => plainToClass(
                    Repository,
                    data,
                    { strategy: 'excludeAll' })
                ))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException(
                `Failed to update Github repository "${repo}" of "${owner}"`);
        }
    }

    public async deleteRepository(owner: string, repo: string): Promise<Repository> {
        try {
            return await this.octokit.repos
                .delete({ owner, repo});
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException(
                `Failed to delete Github repository "${repo}" of "${owner}"`);
        }
    }

    public async createOrUpdateFile(owner: string, repo: string, path: string,
        options: FileCommitDto): Promise<FileCommitResponseDto> {
        try {
            return await this.octokit.repos.createOrUpdateFile({
                owner,
                repo,
                path,
                ...options
            });
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException(
                `Failed to create or update file to Github repository "${repo}" of "${owner}" in ${path}`);
        }
    }

    public async deleteFile(owner: string, repo: string, path: string,
        options: FileCommitDto): Promise<FileCommitResponseDto> {
        try {
            return await this.octokit.repos.createOrUpdateFile({
                owner,
                repo,
                path,
                ...options
            });
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new InternalServerErrorException(
                `Failed to delete file from Github repository "${repo}" of "${owner}" in ${path}`);
        }
    }
}

