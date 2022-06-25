export namespace GitTypes {
    export interface FileTreeNode {
        fileName: string;
        parentDirName?: string;
        parentDirPath?: string;
        content?: string | null;
    }

    export interface DirTreeNode {
        dirName: string;
        parentDirName?: string;
        parentDirPath?: string;
        dirFiles?: DirectoryFiles;
    }

    export type DirectoryFiles = Array<DirTreeNode | FileTreeNode>;

    export type FileContent = string;

    export interface BasePathInfo {
        name: string;
        parentDirName: string;
        parentDirPath: string;
    }
}

export default GitTypes;
