import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

const { Octokit } = require('@octokit/rest');

import { config } from '../../config';
import { AppLogger } from '../app.logger';
import { asyncForEach } from '../_helpers';
import {
    CreateRepoDto,
    RepositoryDto,
    UpdateRepoDto,
    UserDto,
    FileCommitDto,
    FileCommitResponseDto,
    FileContentsDto,
    TreeDto
} from './dto';

/**
 * Wrapper around Github Octokit REST client for authenticated users
 */
export class GithubClient {

    private logger = new AppLogger(GithubClient.name);

    protected octokit;
    protected user: UserDto;
    protected owner: string;

    public static async createClient({ auth_token, org }: { auth_token?: string; org?: string }) {
        const client: GithubClient = new GithubClient();
        client.octokit = client.connectClient(auth_token);
        client.user = await client.getUser();
        client.owner = org || client.user.login;
        return client;
    }

    public async createRepository(options: CreateRepoDto): Promise<RepositoryDto> {
        try {
            return from(this.octokit.repos.createForAuthenticatedUser(options))
                .pipe(map(({ data }) => plainToClass(RepositoryDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error('Failed to create Github repository');
        }
    }

    public async getRepository(repo: string): Promise<RepositoryDto> {
        try {
            return from(this.octokit.repos.get({ owner: this.owner, repo }))
                .pipe(map(({ data }) => plainToClass(RepositoryDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to retrieve Github repository "${repo}" of "${this.owner}"`);
        }
    }

    public async getTree(repo: string, tree_sha: string): Promise<TreeDto> {
        try {
            return from(this.octokit.git.getTree({ owner: this.owner, repo, tree_sha, recursive: 1 }))
                .pipe(map(({ data }) => plainToClass(TreeDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to retrieve tree ${tree_sha} Github repository "${repo}" of "${this.owner}"`);
        }
    }

    public async updateRepository(repo: string, options: UpdateRepoDto): Promise<RepositoryDto> {
        try {
            return from(this.octokit.repos.update({ owner: this.owner, repo, ...options }))
                .pipe(map(({ data }) => plainToClass(RepositoryDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to update Github repository "${repo}" of "${this.owner}"`);
        }
    }

    public async deleteRepository(repo: string): Promise<RepositoryDto> {
        return await this.octokit.repos
            .delete({ owner: this.owner, repo });
    }

    public async getFileContents(repo: string, path: string): Promise<FileContentsDto> {
        try {
            return from(this.octokit.repos.getContent({
                    owner: this.owner,
                    repo,
                    path
                }))
                .pipe(map(({ data }) => plainToClass(FileContentsDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to get contents of ${path} from Github repository "${repo}" of "${this.owner}"`);
        }
    }

    public async getDirectoryContents(repo: string, path: string): Promise<FileContentsDto[]> {
        try {
            return from(this.octokit.repos.getContent({
                    owner: this.owner,
                    repo,
                    path
                }))
                .pipe(map(({data}) => plainToClass(FileContentsDto, data as object[])))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to get contents of ${path} from Github repository "${repo}" of "${this.owner}"`);
        }
    }

    public async createOrUpdateFile(repo: string, path: string,
        options: FileCommitDto): Promise<FileCommitResponseDto> {
        try {
            return from(this.octokit.repos.createOrUpdateFileContents({
                    owner: this.owner,
                    repo,
                    path,
                    ...options
                }))
                .pipe(map(({ data }) => plainToClass(FileCommitResponseDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to create or update file to Github repository "${repo}" of "${this.owner}" in ${path}`);
        }
    }

    public async deleteFile(repo: string, path: string,
        options: FileCommitDto): Promise<FileCommitResponseDto> {
        try {
            return from(this.octokit.repos.deleteFile({
                    owner: this.owner,
                    repo,
                    path,
                    ...options
                }))
                .pipe(map(({ data }) => plainToClass(FileCommitResponseDto, data)))
                .toPromise();
        } catch (e) {
            this.logger.error(e.message, e.trace);
            throw new Error(
                `Failed to delete file from Github repository "${repo}" of "${this.owner}" in ${path}`);
        }
    }

    public async deleteFolder(repo: string, path: string,
        options: FileCommitDto): Promise<void> {
        const items: FileContentsDto[] = await this.getDirectoryContents(repo, path);
        await asyncForEach(items, (item: FileContentsDto) => {
            if (item.type === 'file') {
                return this.deleteFile(repo, item.path, {
                    ...options,
                    sha: item.sha || undefined,
                    message: `Removed ${item.path}`
                });
            }
            return this.deleteFolder(repo, item.path, options);
        });
    }

    protected connectClient(authToken?: string): any {
        if (authToken) {
            return new Octokit({
                auth: authToken
            });
        }

        // TODO create Octokit instance

        return undefined;
    }

    protected async getUser(): Promise<UserDto> {
        const { data: user } = await this.octokit.users.getAuthenticated();
        return user;
    }
}
