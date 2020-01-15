
export class TreeDto {
    sha?: string;
    url?: string;
    tree?: TreeItem[];
    truncated?: boolean;
}

export class TreeItem {
    path?: string;
    mode?: string;
    type?: string;
    size?: number;
    sha?: string;
    url?: string;
}
