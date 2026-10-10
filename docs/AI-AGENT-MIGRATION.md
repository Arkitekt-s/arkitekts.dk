# AI agent migration plan

## Repositories

- `Arkitekt-s/arkitekts.dk`: the new GitHub Pages portfolio website
- `Arkitekt-s/wordpress-mcp`: the existing, private WordPress MCP publishing agent

## Verified in the existing agent

The agent uses the WordPress REST API and creates unpublished WordPress drafts using locked article templates. Its current content destination is WordPress, not GitHub. No WordPress access or draft functionality should be removed during the migration.

## Target workflow (not implemented yet)

1. Read existing WordPress posts and media without changing them.
2. Export a complete URL, SEO and image inventory.
3. Transform old articles to consistent GitHub Pages guide templates.
4. For each new technical guide, create a **draft GitHub pull request**, not a direct push to the public site.
5. Review the guide's technical accuracy, assets, SEO and responsiveness.
6. Merge only after manual approval; deploy the preview using GitHub Actions.
7. Repoint the custom domain only after every old article URL is preserved.

## Security

The private `wordpress-mcp` repository contains a tracked file named `agent-password`. Its contents have not been inspected here. If it contains a valid password or token, move the credential to a secret manager, rotate it, remove it from tracked files, and evaluate whether historical commits require cleanup. Do not place secrets in the new public website repository.

A future GitHub publishing adapter must use narrowly scoped credentials stored only in the agent runtime, and should generate draft PRs for review instead of publishing automatically.

## Deployment blocker

GitHub Pages is not yet activated for `arkitekts.dk`. Open Settings → Pages → Build and deployment, select GitHub Actions, then rerun the deployment workflow. DNS stays unchanged.
