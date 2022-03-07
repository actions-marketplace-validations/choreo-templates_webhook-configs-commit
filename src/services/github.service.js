import {Octokit} from "@octokit/core";

class GitHubService {
    constructor(token, org, repo) {
        this.token = token;
        this.org = org;
        this.repo = repo;
        this.octokit = new Octokit({
            auth: this.token
        });
    }


}

export { GitHubService };
