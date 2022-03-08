import * as core from "@actions/core";
import { BallerinaTriggerService } from "./src/services/ballerina-trigger.service.js";
import { GitHubService } from "./src/services/github.service.js";
import { triggerTemplateHbs } from "./src/config/constants.js";

try {
  const token = core.getInput("token");
  const env = core.getInput("environment");
  const org = core.getInput("org");
  const repo = core.getInput("repo");
  const branch = core.getInput("branch");
  const isHttpBased = core.getInput("isHttpBased");
  const ballerinaTriggerID = parseInt(core.getInput("ballerinaTriggerID"));
  console.log({
    token: token,
    environment: env,
    org: org,
    repo: repo,
    branch: branch,
    isHttpBased: isHttpBased,
    ballerinaTriggerID: ballerinaTriggerID,
  });
  const ballerinaTriggerService = new BallerinaTriggerService(
    env,
    ballerinaTriggerID,
    isHttpBased === "true" || true
  );

  const githubService = new GitHubService(token, org, repo);

  ballerinaTriggerService
    .getFilteredTriggers()
    .then((filteredTriggers) => {
      const base64Payload = Buffer.from(
        JSON.stringify(filteredTriggers)
      ).toString("base64");

      githubService
        .createBranch(branch)
        .then(() => {
          githubService
            .createMultipleFiles(branch, "Choreo Webhook Configs Added", [
              { data: base64Payload, path: "data.json" },
              { data: triggerTemplateHbs, path: "triggertemplate.hbs" },
            ])
            .then(() => {
              console.log(`Config files committed successfully`);
              core.setOutput("status", "success");
            })
            .catch((e) => {
              core.setOutput("status", "failure");
              console.error(`Error: ${e}`);
              core.setOutput("error", e.message);
            });
        })
        .catch((e) => {
          core.setOutput("status", "failure");
          console.error(`Error: ${e}`);
          core.setOutput("error", e.message);
        });
    })
    .catch((e) => {
      core.setOutput("status", "failure");
      console.error(`Error: ${e}`);
      core.setOutput("error", e.message);
    });
} catch (e) {
  core.setOutput("choreo-webhook-config-commit-status", "failed");
  core.setFailed(e.message);
  console.log("choreo-webhook-config-commit-status", "failed");
  console.log(e.message);
}
