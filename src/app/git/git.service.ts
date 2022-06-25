import { Injectable } from '@nestjs/common';
import { AppLogger } from '../app.logger';
import { UserEntity } from '../user/entity/user.entity';
import { ProjectEntity } from '../project/entity/project.entity';
import simpleGit from 'simple-git';
import * as fse from 'fs-extra';
import GitTypes from './git-types';
import { Readable } from 'stream';
import { exec, ExecException } from 'child_process';
import os from 'os';
import { sep } from 'path';
import { config } from '../../config';

@Injectable()
export class GitService {
    private logger = new AppLogger(GitService.name);
    private git = simpleGit();
    private baseGitDirPath: string =
        os.platform() === 'win32'
            ? process.cwd().split(sep)[0] + `/${config.gitBaseDir}`
            : `/${config.gitBaseDir}`;

    public async createProjectRepository(
        user: UserEntity,
        project: ProjectEntity
        // project: { id: string; name: string; description: string }
    ): Promise<boolean> {
        const newRepositoryPath: string = `${this.baseGitDirPath}/${project.id}`;
        try {
            this.logger.debug(
                `[createProjectRepository] Create Git repository "${newRepositoryPath}"`
            );
            const isBaseGitDirExists: boolean = await fse.pathExists(
                this.baseGitDirPath
            );
            if (!isBaseGitDirExists) {
                await fse.mkdir(this.baseGitDirPath);
                await this.git.addConfig(
                    'user.email',
                    config.gitUserEmail,
                    false,
                    'global'
                );
                await this.git.addConfig(
                    'user.name',
                    config.gitUserName,
                    false,
                    'global'
                );
                this.logger.debug(
                    `[createProjectRepository] Created base Git directory "${this.baseGitDirPath}"`
                );
            }
            const isRepositoryExists: boolean = await fse.pathExists(
                newRepositoryPath
            );
            if (isRepositoryExists) {
                this.logger.debug(
                    `[createProjectRepository] Git repository "${newRepositoryPath}" already exists`
                );
                return false;
            }
            await fse.mkdir(newRepositoryPath);
            const readMeContent: string = `[${project.name}]\n${project.description}`;
            await fse.writeFile(
                `${newRepositoryPath}/README.md`,
                readMeContent
            );
            await this.git.cwd(newRepositoryPath);
            await this.git.init();
            await this.git.add('.');
            await this.git.commit(`Created repository "${project.id}"`);
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[createProjectRepository] Git repository "${newRepositoryPath}" created`
            );
            return true;
        } catch (err) {
            this.logger.error(err.message, err.trace);
            this.logger.error(
                `[createProjectRepository] Git repository "${newRepositoryPath}" not created, because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async updateProjectRepository(
        user: UserEntity,
        project: ProjectEntity
    ): Promise<boolean> {
        const repositoryPath: string = `${this.baseGitDirPath}/${project.id}`;
        try {
            this.logger.debug(
                `[updateProjectRepository] Update Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[updateProjectRepository] Git repository "${repositoryPath}" does not exist`
                );
                return false;
            }
            await this.deleteFile(project.id, `${repositoryPath}/README.md`);
            const readMeContent: string = `[${project.name}]\n${project.description}`;
            await this.createFile(
                user,
                project.id,
                `${repositoryPath}/README.md`,
                readMeContent
            );
            await this.git.cwd(repositoryPath);
            await this.git.add('.');
            await this.git.commit(`Updated repository "${project.id}"`);
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[updateProjectRepository] Git repository "${repositoryPath}" updated`
            );

            return true;
        } catch (err) {
            this.logger.error(
                `[updateProjectRepository] Git repository "${repositoryPath}" not updated, because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteProjectRepository(project: ProjectEntity): Promise<void> {
        const repositoryPath: string = `${this.baseGitDirPath}/${project.id}`;
        try {
            this.logger.debug(
                `[deleteProjectRepository] Delete Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[deleteProjectRepository] Git repository does not exist`
                );
                return;
            }
            await fse.rm(repositoryPath, {
                force: true,
                maxRetries: 2,
                recursive: true,
                retryDelay: 100
            });
            this.logger.debug(
                `[deleteProjectRepository] Git repository "${repositoryPath}" deleted`
            );
        } catch (err) {
            this.logger.error(
                `[deleteProjectRepository] Git repository "${repositoryPath}" not deleted, because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async createFile(
        user: UserEntity,
        projectId: string,
        path: string,
        content: string
    ): Promise<string | null> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        const fullPathToFile: string = this.resolveFullPath(projectId, path);
        try {
            this.logger.debug(
                `[createFile] Create file ${fullPathToFile} in Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[createFile] Git repository "${repositoryPath}" does not exist`
                );
                return null;
            }
            await this.resolveDirectories(
                projectId,
                path.split('/').slice(0, -1)
            );
            const isFileExists: boolean = await fse.pathExists(fullPathToFile);
            if (isFileExists) {
                this.logger.debug(
                    `[createFile] File "${fullPathToFile}" in Git repository "${repositoryPath}" already exist`
                );
                return null;
            }
            await fse.writeFile(fullPathToFile, content);
            const { name } = await this.resolveProvidedPathProps(
                fullPathToFile
            );
            await this.git.cwd(repositoryPath);
            await this.git.add('.');
            await this.git.commit(
                `Created file "${name}" in repository "${projectId}"`
            );

            const sha: string = (
                await this.execCommand('git rev-parse HEAD')
            ).replace(/\r?\n|\r/g, '');
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[createFile] File ${fullPathToFile} created in Git repository "${repositoryPath}"`
            );
            return sha;
        } catch (err) {
            this.logger.error(
                `[createFile] File ${fullPathToFile} not created in Git repository "${repositoryPath}", because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async updateFile(
        user: UserEntity,
        projectId: string,
        path: string,
        content: string
    ): Promise<string | null> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        const fullPathToFile: string = this.resolveFullPath(projectId, path);
        try {
            this.logger.debug(
                `[updateFile] Update file ${fullPathToFile} in Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[updateFile] Git repository "${repositoryPath}" does not exist`
                );
                return null;
            }
            await this.resolveDirectories(
                projectId,
                path.split('/').slice(0, -1)
            );
            const isFileExists: boolean = await fse.pathExists(fullPathToFile);
            if (isFileExists) {
                await fse.rm(fullPathToFile, {
                    force: true,
                    recursive: true,
                    maxRetries: 2,
                    retryDelay: 100
                });
            }
            await fse.writeFile(fullPathToFile, content);
            const { name } = await this.resolveProvidedPathProps(
                fullPathToFile
            );
            await this.git.cwd(repositoryPath);
            await this.git.add('.');
            await this.git.commit(
                `Updated file "${name}" in repository "${projectId}"`
            );
            const sha: string = (
                await this.execCommand('git rev-parse HEAD')
            ).replace(/\r?\n|\r/g, '');
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[updateFile] File "${fullPathToFile}" updated in Git repository "${repositoryPath}"`
            );
            return sha;
        } catch (err) {
            this.logger.error(
                `[updateFile] File "${fullPathToFile}" not updated in Git repository "${repositoryPath}", because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteFile(projectId: string, path: string): Promise<boolean> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        const fullPathToFile: string = this.resolveFullPath(projectId, path);
        try {
            this.logger.debug(
                `[deleteFile] Delete file "${fullPathToFile}" in Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[deleteFile] Git repository "${repositoryPath}" does not exist`
                );
                return false;
            }
            const isFileExists: boolean = await fse.pathExists(fullPathToFile);
            if (!isFileExists) {
                this.logger.debug(
                    `[deleteFile] File "${fullPathToFile}" in Git repository "${repositoryPath}" does not exist`
                );
                return false;
            }
            await fse.rm(fullPathToFile, {
                force: true,
                recursive: true,
                maxRetries: 2,
                retryDelay: 100
            });
            const { name } = await this.resolveProvidedPathProps(
                fullPathToFile
            );
            await this.git.cwd(repositoryPath);
            await this.git.add('.');
            await this.git.commit(
                `Deleted file "${name}" in repository "${projectId}"`
            );
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[deleteFile] File "${fullPathToFile}" deleted in Git repository "${repositoryPath}"`
            );
            return true;
        } catch (err) {
            this.logger.error(
                `[deleteFile] File "${fullPathToFile}" not deleted in Git repository "${repositoryPath}", because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async deleteFolder(
        user: UserEntity,
        projectId: string,
        path: string
    ): Promise<boolean> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        const fullPathToFile: string = this.resolveFullPath(projectId, path);
        try {
            this.logger.debug(
                `[deleteFolder] Delete folder "${fullPathToFile}" in Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[deleteFolder] Git repository "${repositoryPath}" does not exist`
                );
                return false;
            }
            const isFolderExists: boolean = await fse.pathExists(
                fullPathToFile
            );
            if (!isFolderExists) {
                this.logger.debug(
                    `[deleteFolder] Folder "${fullPathToFile}" in Git repository "${repositoryPath}" does not exist`
                );
                return false;
            }
            await fse.rm(fullPathToFile, {
                force: true,
                recursive: true,
                maxRetries: 2,
                retryDelay: 100
            });
            const { name } = await this.resolveProvidedPathProps(
                fullPathToFile
            );
            await this.git.cwd(repositoryPath);
            await this.git.add('.');
            await this.git.commit(
                `Deleted folder "${name}" in repository "${projectId}"`
            );
            await this.git.cwd(this.baseGitDirPath);
            this.logger.debug(
                `[deleteFolder] Folder "${fullPathToFile}" deleted in Git repository "${repositoryPath}"`
            );
            return true;
        } catch (err) {
            this.logger.error(
                `[deleteFolder] Folder "${fullPathToFile}" not deleted in Git repository "${repositoryPath}", because ${JSON.stringify(
                    err.message
                )}`,
                err.stack
            );
            throw err;
        }
    }

    public async getFileContents(
        user: UserEntity,
        projectId: string,
        fileName: string
    ): Promise<GitTypes.FileTreeNode | null> {
        try {
            this.logger.debug(`[getFileContents] Get ${fileName} contents`);
            let filePath: string;
            if (fileName.split('/').length > 1) {
                filePath = this.resolveFullPath(projectId, fileName);
            } else {
                filePath = await this.getFilePath(user, projectId, fileName);
            }

            const isFileExists: boolean = await fse.pathExists(filePath);
            if (!isFileExists) {
                this.logger.debug(
                    `[getFileContents] File "${filePath}" does not exist`
                );
                return null;
            }
            const buffer: Buffer = await fse.readFile(filePath);
            const readableStream = await Readable.from(buffer);
            const content: string = await new Promise<string>(
                (resolve, reject) => {
                    const chunks: string[] = [];

                    readableStream.on('error', (error: Error) => reject(error));
                    readableStream.on('data', (chunk) => chunks.push(chunk));
                    readableStream.on('end', () =>
                        resolve(chunks.concat().toString())
                    );
                }
            );
            const { name, parentDirName, parentDirPath } =
                await this.resolveProvidedPathProps(filePath);
            this.logger.debug(
                `[getFileContents] Contents of file "${fileName}" at path "${filePath}" retrieved from Git repository`
            );
            return {
                fileName: name,
                parentDirName,
                parentDirPath,
                content
            };
        } catch (err) {
            this.logger.error(
                `[getFileContents] Contents of ${fileName} not retrieved from Git repository, \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    public async getDirectoryContents(
        user: UserEntity,
        projectId: string,
        path: string
    ): Promise<GitTypes.DirTreeNode> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        try {
            this.logger.debug(
                `[getDirectoryContents] Get ${path} contents from Git repository "${repositoryPath}"`
            );
            const isRepositoryExists: boolean = await fse.pathExists(
                repositoryPath
            );
            if (!isRepositoryExists) {
                this.logger.debug(
                    `[getDirectoryContents] Git repository "${repositoryPath}" does not exist`
                );
                return;
            }
            const isDirectoryExists: boolean = await fse.pathExists(path);
            if (!isDirectoryExists) {
                this.logger.debug(
                    `[getDirectoryContents] Provided directory "${path}" does not exist`
                );
                return;
            }

            const { name, parentDirName, parentDirPath } =
                await this.resolveProvidedPathProps(path);
            const dirFiles: GitTypes.DirectoryFiles =
                await this.getDirectoryContentsTree(
                    user,
                    projectId,
                    parentDirName,
                    parentDirPath
                );
            this.logger.debug(
                `[getDirectoryContents] Contents of ${path} retrieved from Git repository "${repositoryPath}"`
            );
            return dirFiles[0] as GitTypes.DirTreeNode;
        } catch (err) {
            this.logger.error(
                `[getDirectoryContents] Contents of ${path} not retrieved from Git repository "${repositoryPath}", \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private resolveFullPath(projectId: string, path: string): string {
        const p = path.split('/');
        if (!(p[0] === this.baseGitDirPath && p[1] === projectId)) {
            return `${this.baseGitDirPath}/${projectId}/${path}`;
        }
        if (p[0] === projectId) {
            return `${this.baseGitDirPath}/${path}`;
        }
        return path;
    }

    private async searchDirectoryForFilePath(
        dirPath: string,
        fileName: string
    ): Promise<string | null> {
        const dirFiles: string[] = await fse.readdir(dirPath);

        if (dirFiles.length <= 0) {
            this.logger.debug(
                `[searchDirectoryForFilePath] Provided directory path "${dirPath}" has no inner files`
            );
            return null;
        }

        const isFileInCurrentDir: string | undefined = dirFiles.find(
            (file) => file === fileName
        );

        if (isFileInCurrentDir) {
            return `${dirPath}/${fileName}`;
        }

        let i: number = 0;
        for (i; i < dirFiles.length; i++) {
            if (dirFiles[i] !== '.git') {
                const nextDirPath = `${dirPath}/${dirFiles[i]}`;
                const isDir = (await fse.stat(nextDirPath)).isDirectory();
                if (isDir) {
                    const filePath = await this.searchDirectoryForFilePath(
                        nextDirPath,
                        fileName
                    );
                    if (filePath) {
                        return filePath;
                    }
                }
            }
        }

        return null;
    }

    private async resolveDirectories(
        projectId: string,
        dirPathsList: string[]
    ): Promise<void> {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        try {
            let currentPathToDir: string = repositoryPath;
            let i: number = 0;
            for (i; i < dirPathsList.length; i++) {
                currentPathToDir += `/${dirPathsList[i]}`;
                const isDirExists: boolean = await fse.pathExists(
                    currentPathToDir
                );
                if (!isDirExists) {
                    await fse.mkdir(currentPathToDir);
                }
            }
            return;
        } catch (err) {
            this.logger.error(
                `[resolveDirectories] Failed to resolve directories in Git repository "${projectId}", \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private async getFilePath(
        user: UserEntity,
        projectId: string,
        fileName: string
    ): Promise<string> {
        try {
            this.logger.debug(
                `[getFilePath] Get file "${fileName}" path in Git repository "${projectId}"`
            );
            const filePath = await this.searchDirectoryForFilePath(
                `${this.baseGitDirPath}/${projectId}`,
                fileName
            );
            this.logger.debug(
                `[getFilePath] File "${fileName}" path "${filePath}" was found in Git repository "${projectId}"`
            );
            return filePath;
        } catch (err) {
            this.logger.error(
                `[getFilePath] File "${fileName}" path was not found in Git repository "${projectId}", \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private async resolveProvidedPathProps(
        path: string
    ): Promise<GitTypes.BasePathInfo> {
        const name: string = path.slice(path.lastIndexOf('/') + 1, path.length);
        const parentDirPath: string = path.slice(0, path.lastIndexOf('/'));
        const parentDirName: string = parentDirPath.slice(
            parentDirPath.lastIndexOf('/') + 1,
            parentDirPath.length
        );

        return { name, parentDirName, parentDirPath };
    }

    private updateLocalRepository = async (
        projectId: string,
        updates: GitTypes.DirTreeNode
    ): Promise<void> => {
        const repositoryPath: string = `${this.baseGitDirPath}/${projectId}`;
        try {
            const { dirFiles } = updates;
            if (!dirFiles) {
                return null;
            }

            await dirFiles.reduce<Promise<GitTypes.DirectoryFiles>>(
                async (acc, file) => {
                    const currentAcc = await acc;
                    const { parentDirName, parentDirPath } = file;

                    const { fileName, content } = file as GitTypes.FileTreeNode;
                    if (Boolean(fileName)) {
                        const currentPathToFile: string = `${parentDirPath}/${fileName}`;
                        if (fileName === '.git') {
                            return currentAcc;
                        }
                        const isFileExists: boolean = await fse.pathExists(
                            currentPathToFile
                        );
                        if (isFileExists) {
                            await fse.rm(currentPathToFile, {
                                force: true,
                                recursive: true,
                                maxRetries: 2,
                                retryDelay: 100
                            });
                        }
                        await fse.writeFile(currentPathToFile, content);

                        return currentAcc;
                    }

                    const dir = file as GitTypes.DirTreeNode;
                    if (Boolean(dir.dirName)) {
                        const currentPathToDir: string = `${parentDirPath}/${dir.dirName}`;
                        const isDirExists: boolean = await fse.pathExists(
                            currentPathToDir
                        );
                        if (!isDirExists) {
                            await fse.mkdir(currentPathToDir);
                        }

                        await this.updateLocalRepository(projectId, {
                            dirName: dir.dirName,
                            parentDirName,
                            parentDirPath,
                            dirFiles: dir.dirFiles
                        });
                    }

                    return currentAcc;
                },
                Promise.resolve([])
            );

            return;
        } catch (err) {
            this.logger.error(
                `[updateLocalRepository] Failed to update local Git repository "${repositoryPath}", \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private getDirectoryContentsTree = async (
        user: UserEntity,
        projectId: string,
        parentDirName: string,
        parentDirPath: string
    ): Promise<GitTypes.DirectoryFiles> => {
        try {
            const dirFiles: string[] = await fse.readdir(parentDirPath);

            if (dirFiles.length <= 0) {
                return null;
            }

            const dirTree: GitTypes.DirectoryFiles = await dirFiles.reduce<
                Promise<GitTypes.DirectoryFiles>
            >(async (acc, fileName) => {
                const currentAcc = await acc;
                const currentPathToFile: string = `${parentDirPath}/${fileName}`;

                if (fileName === '.git') {
                    return currentAcc;
                }

                const isFile = (await fse.stat(currentPathToFile)).isFile();
                if (isFile) {
                    const fileContent: GitTypes.FileTreeNode =
                        await this.getFileContents(user, projectId, fileName);
                    if (fileContent) {
                        currentAcc.push(fileContent);
                        return currentAcc;
                    }
                }

                const isDir = (await fse.stat(currentPathToFile)).isDirectory();
                if (isDir) {
                    const directoryContent: GitTypes.DirectoryFiles =
                        await this.getDirectoryContentsTree(
                            user,
                            projectId,
                            fileName,
                            currentPathToFile
                        );
                    currentAcc.push({
                        fileName,
                        parentDirName,
                        parentDirPath,
                        dirFiles: directoryContent
                    });
                }

                return currentAcc;
            }, Promise.resolve([]));

            return dirTree;
        } catch (err) {
            this.logger.error(
                `[getDirectoryContentsTree] Directory contents tree of ${parentDirPath} not retrieved, \
                    because ${JSON.stringify(err.message)}`,
                err.stack
            );
            throw err;
        }
    }

    private execCommand = async (command: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            return exec(
                command,
                (
                    error: ExecException | null,
                    stdout: string,
                    stderr: string
                ) => {
                    if (error) {
                        reject(stderr);
                    }
                    resolve(stdout);
                }
            );
        });
    }
}
