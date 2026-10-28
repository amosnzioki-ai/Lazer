# Share the PeopleHub demo on Render

`render.yaml` defines a Render Static Site named `kisc-peoplehub-demo`. It builds the public website, including **Explore HR demo**, from the current source. The HR demonstration includes fictional employee profiles, health examples and reports/meetings. It stores edits in each visitor's browser; visitors do not share a database. It is a public demonstration, not the staff-only production HR service. Do not enter real personnel or health information.

No backend service, database, development account, password or health encryption key is deployed by this configuration. No environment secrets are needed for the static build.

## Deploy

1. Publish the current project source, including `render.yaml`, to `amosnzioki-ai/Lazer` on GitHub. The README alone is insufficient; the source must be in the selected branch.
2. In your connected Render account, choose **New → Blueprint**, select the repository and branch, and review the single static site before deploying.
3. Wait for the deploy to succeed and open the actual URL shown in Render. The requested name does not guarantee the assigned URL. Share the verified URL with your reviewer.

For a manual **New → Static Site** instead, use:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --include=dev && npm run build:website` |
| Publish directory | `website-dist` |
| Environment variable | `NODE_VERSION=24` |

The blueprint also supplies an SPA fallback and static response headers. The public homepage's **Explore HR demo** opens the current interactive fictional HR workspace without a backend or login.

## Deployment status

As of 28 October 2026, the static build, desktop/mobile website checks and HR-demo entry check pass. Git repository transport works, although GitHub API authentication fails. There is no callable Render connection in this chat, so no Render service has been created or live URL verified by this session. Render deployment access must be made available to finish automated publication.
