import { Octokit } from "@octokit/core";

class GitHubService {
  constructor(token, org, repo) {
    this.token = token;
    this.org = org;
    this.repo = repo;
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  async createBranch(branch, headBranch = "main") {
    try {
      const isBranchExists = await this.isBranchExists(branch);
      if (isBranchExists) return;

      console.log(`Creating branch ${branch} in ${this.org}/${this.repo}`);
      console.log(`Getting head branch: ${headBranch} sha`);
      const referenceRes = await this.octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner: this.org,
          repo: this.repo,
          ref: `heads/${headBranch}`,
        }
      );
      const ref = referenceRes?.data;
      const sha = ref?.object?.sha;
      console.log(`Head branch sha: ${sha}`);
      if (!sha) {
        return new Error(
          `Head branch ${headBranch} does not exist in ${this.org}/${this.repo}`
        );
      }
      console.log(`Creating branch ${branch} with sha ${sha}`);

      const response = await this.octokit.request(
        "POST /repos/{owner}/{repo}/git/refs",
        {
          owner: this.org,
          repo: this.repo,
          ref: `refs/heads/${branch}`,
          sha: sha,
        }
      );

      return response.status === 201;
    } catch (e) {
      console.log(
        `Branch ${branch} creation failed in ${this.org}/${this.repo}: [ERROR] ${e.message}`
      );
      return e;
    }
  }

  /**
   * Create Multiple Files
   * @param branch
   * @param message
   * @param data - [{data, path}, {data, path}]
   * @returns {Promise<void>}
   */
  async createMultipleFiles(branch, message, data) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const currentCommit = await this.getCurrentCommit(branch);

      const filesPaths = [];
      data.map((d) => filesPaths.push(d.path));

      const filesBlobs = await Promise.all(
        data.map((d) => this.createBlobForFile(d.data))
      );

      const newTree = await this.createNewTree(
        filesBlobs,
        filesPaths,
        currentCommit.treeSha
      );

      const newCommit = await this.createNewCommit(
        message,
        newTree.sha,
        currentCommit.commitSha
      );
      await this.setBranchToCommit(branch, newCommit.sha);
    } catch (e) {
      console.error(
        `Error while creating files in ${this.org}/${this.repo}: [ERROR] ${e.message}`
      );
      throw e;
    }
  }

  async setBranchToCommit(branch, commitSha) {
    try {
      return await this.octokit.request(
        "PATCH /repos/{owner}/{repo}/git/refs/{ref}",
        {
          owner: this.org,
          repo: this.repo,
          ref: `heads/${branch}`,
          sha: commitSha,
          force: true,
        }
      );
    } catch (e) {
      console.error(`Branch ${branch} update failed: [ERROR] ${e.message}`);
      throw e;
    }
  }

  async getCurrentCommit(branch) {
    try {
      const { data: refData } = await this.octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner: this.org,
          repo: this.repo,
          ref: `heads/${branch}`,
        }
      );

      const commitSha = refData.object.sha;
      const { data: commitData } = await this.octokit.request(
        "GET /repos/{owner}/{repo}/git/commits/{commit_sha}",
        {
          owner: this.org,
          repo: this.repo,
          commit_sha: commitSha,
        }
      );

      return {
        commitSha,
        treeSha: commitData.tree.sha,
      };
    } catch (e) {
      console.error("Failed to get current commit : %o", e.message);
      throw e;
    }
  }

  async createBlobForFile(content) {
    try {
      const blobData = await this.octokit.request(
        "POST /repos/{owner}/{repo}/git/blobs",
        {
          owner: this.org,
          repo: this.repo,
          content: content,
          encoding: "base64",
        }
      );
      return blobData.data;
    } catch (e) {
      console.error("Failed to get blob files : %o", e.message);
      throw e;
    }
  }

  async createNewTree(blobs, paths, parentTreeSha) {
    try {
      const tree = blobs.map(({ sha }, index) => ({
        path: paths[index],
        mode: `100644`,
        type: `blob`,
        sha,
      }));

      const { data } = await this.octokit.request(
        "POST /repos/{owner}/{repo}/git/trees",
        {
          owner: this.org,
          repo: this.repo,
          tree,
          base_tree: parentTreeSha,
        }
      );

      return data;
    } catch (e) {
      console.error("Failed to create new tree : %o", e.message);
      throw e;
    }
  }

  async createNewCommit(message, currentTreeSha, currentCommitSha) {
    try {
      const res = await this.octokit.request(
        "POST /repos/{owner}/{repo}/git/commits",
        {
          owner: this.org,
          repo: this.repo,
          message,
          tree: currentTreeSha,
          parents: [currentCommitSha],
        }
      );

      return res.data;
    } catch (e) {
      console.error("Failed to create new commit : %o", e.message);
      throw e;
    }
  }

  async isBranchExists(branch) {
    console.log(
      `Checking if branch ${branch} exists in ${this.org}/${this.repo}`
    );
    try {
      const response = await this.octokit.request(
        "GET /repos/{owner}/{repo}/branches/{branch}",
        {
          owner: this.org,
          repo: this.repo,
          branch: branch,
        }
      );

      return response.status === 200;
    } catch (e) {
      console.log(
        `Branch ${branch} does not exist in ${this.org}/${this.repo}`
      );
      return false;
    }
  }
}

export { GitHubService };
