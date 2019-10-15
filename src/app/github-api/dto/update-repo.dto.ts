
export class UpdateRepoDto {
    // name of the repository
    name?: string;
    // short description of the repository
    description?: string;
    // URL with more information about the repository
    homepage?: string;
    // either true to create a private repository or false to create a public one
    private?: boolean;
    // enable issues for this repository
    has_issues?: boolean;
    // enable projects for this repository
    has_projects?: boolean;
    // enable the wiki for this repository
    has_wiki?: boolean;
    // make this repo available as a template repository or false to prevent it
    is_template?: boolean;
    //  default branch for this repository
    default_branch?: string;
    // allow squash - merging pull requests
    allow_squash_merge?: boolean;
    // allow merging pull requests with a merge commit
    allow_merge_commit?: boolean;
    // allow rebase - merging pull requests
    allow_rebase_merge?: boolean;
    // archive this repository (cannot unarchive through API)
    archived?: boolean;
}
