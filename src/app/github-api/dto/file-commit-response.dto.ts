import { AuthorDto } from './author.dto';

export class FileCommitResponseDto {
    content?: Content | null;
    commit: Commit;
}

export class Commit {
    sha: string;
    node_id: string;
    url: string;
    html_url?: string;
    author?: AuthorDto;
    committer?: AuthorDto;
    message: string;
    tree?: Tree;
    parents?: Parent[];
    verification?: Verification;
}

export class Parent {
    url?: string;
    html_url?: string;
    sha?: string;
}

export class Tree {
    url?: string;
    sha?: string;
}

export class Verification {
    verified?: boolean;
    reason?: string;
    signature?: string | null;
    payload?: string | null;
}

export class Content {
    name: string;
    path: string;
    sha: string;
    size?: number;
    url: string;
    html_url?: string;
    git_url?: string;
    download_url?: string;
    type?: string;
    _links?: Links;
}

export class Links {
    self?: string;
    git?: string;
    html?: string;
}
