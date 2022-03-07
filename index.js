import * as core from '@actions/core';

try {
    const token = core.getInput('token');
    const environment = core.getInput('environment');
    const org = core.getInput('org');
    const repo = core.getInput('repo');
    const branch = core.getInput('branch');
    const isHttpBased = core.getInput('isHttpBased');

} catch (e) {
    core.setOutput("choreo-webhook-config-commit-status", "failed");
    core.setFailed(e.message);
    console.log("choreo-webhook-config-commit-status", "failed");
    console.log(e.message);
}
