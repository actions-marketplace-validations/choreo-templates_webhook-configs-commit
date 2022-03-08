# webhook-configs-commit
Choreo webhook configs commit action step

### Sample Usage
```yaml
  name: "Webhook Configs commit"
  uses: "choreo-templates/webhook-configs-commit@v1.0.0"
  with: 
    token: "${{ env.APP_GH_TOKEN }}"
    environment: "DEV"
    org: "${{env.ORG_NAME}}"
    repo: "${{env.APP_NAME}}"
    branch: "choreo-dev"
    isHttpBased: true
    ballerinaTriggerID: 0
```
