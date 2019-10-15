import { AuthorDto } from './author.dto';

export class FileCommitDto {
    // commit message
    message: string;
    // new file content, using Base64 encoding
    content?: string;
    // blob SHA of the file being replaced (required if updating a file)
    sha?: string;
    // branch name
    branch?: string;
    // person that committed the file
    commiter?: AuthorDto;
    // author of the file
    author?: AuthorDto;
}
