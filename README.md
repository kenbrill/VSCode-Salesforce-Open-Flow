# Salesforce Open Flow for VS Code

Open any Salesforce Flow metadata file directly in **Flow Builder** with one click — no terminal, no typing `sf` commands, **no Salesforce CLI required**.

![Version](https://img.shields.io/badge/version-0.2.0-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What it does

When you're working in a Salesforce DX project, jumping from a Flow's source XML to its canvas in Flow Builder means running:

```bash
sf org open --source-file force-app/main/default/flows/My_Flow.flow-meta.xml
```

This extension does the same thing **inside VS Code, in-process**:

- **Right-click any `.flow-meta.xml` file** in the Explorer → *Salesforce: Open Flow in Flow Builder*
- **Right-click inside an open Flow metadata file** → same command
- **Command Palette** → *Salesforce: Open Flow in Flow Builder* (uses the active editor)
- Resolves the Flow's `DurableId` over the REST API, generates a single-use Frontdoor URL via the Salesforce UI Bridge API, and opens Flow Builder in your browser
- Logs every step to a dedicated **"Salesforce Open Flow"** output panel

## No CLI required

The extension bundles [`@salesforce/core`](https://www.npmjs.com/package/@salesforce/core) — the same library the Salesforce CLI is built on — so it talks to Salesforce directly:

- Reuses the org credentials you've already authorized with `sf org login` (stored in `~/.sfdx`)
- Follows the same org-selection rules as the CLI: explicit setting → project default → global default
- Refreshes expired access tokens automatically using the stored refresh token

If you've never logged in to an org, run `sf org login web` once (or use the Salesforce Extension Pack's "Authorize an Org"). After that, this extension works standalone.

## Requirements

- VS Code 1.85+
- An authorized Salesforce org (see above)
- The Flow must exist in the target org — deploy it first if it's local-only (the Flow Builder needs a Flow ID to open)

## Extension Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `salesforceOpenFlow.targetOrg` | `string` | `""` | Target org username or alias. Leave empty to use the default org (project config wins over global, same as `sf`). |

## Known behavior

- The command is only offered on files ending in `.flow-meta.xml`.
- If the flow isn't found in the org (e.g., never deployed), you'll get a clear error — deploy it or switch `targetOrg`.
- Works for the same metadata types `sf org open --source-file` supports for Flow; ApexPage/FlexiPage support may come later.

## Release Notes

### 0.2.0
- **No more CLI dependency** — talks to Salesforce in-process via the bundled `@salesforce/core`; `sf` no longer needs to be installed or on PATH.
- Org resolution now matches the CLI: project `sfdx-project.json` / local config wins over global default.
- Clearer errors when the flow is missing from the org.

### 0.1.0
- Initial release: Explorer + editor context menus, command palette entry, configurable target org, output panel logging (spawned the `sf` CLI).

---

MIT © Ken Brill · [Wallen Creek Software](https://wallencreeksoftware.com)
