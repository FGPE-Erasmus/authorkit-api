
export class CreateRepoDto {
    // name of the repository
    name: string;
    // short description of the repository
    description?: string;
    // URL with more information about the repository
    homepage?: string;
    // either true to create a private repository or false to create a public one
    private = false;
    // enable issues for this repository
    has_issues = true;
    // enable projects for this repository
    has_projects = true;
    // enable the wiki for this repository
    has_wiki = true;
    // make this repo available as a template repository or false to prevent it
    is_template = false;
    // id of the team that will be granted access to this repository (only valid when creating a repository in an organization)
    team_id?: number;
    // create an initial commit with empty README
    auto_init = false;
    // desired language or platform .gitignore template to apply. Use the name of the template without the extension.
    gitignore_template?: string;
    // license for the project (e.g., mit, mpl-2.0, etc)
    license_template?: string;
    // allow squash - merging pull requests
    allow_squash_merge = true;
    // allow merging pull requests with a merge commit
    allow_merge_commit = true;
    // allow rebase - merging pull requests
    allow_rebase_merge = true;
}
