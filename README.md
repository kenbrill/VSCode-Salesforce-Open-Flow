# Salesforce Open Flow for VS Code

Open any Salesforce Flow metadata file directly in **Flow Builder** with one click — no terminal, no typing `sf` commands, **no Salesforce CLI required**.

![Version](https://img.shields.io/badge/version-0.3.0-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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
- **Built-in org login** — *Salesforce Open Flow: Log in to Org* runs the browser OAuth flow itself; no Salesforce CLI or Extension Pack needed, ever
- Logs every step to a dedicated **"Salesforce Open Flow"** output panel

## No CLI required

The extension bundles [`@salesforce/core`](https://www.npmjs.com/package/@salesforce/core) — the same library the Salesforce CLI is built on — so it talks to Salesforce directly:

- Reuses org credentials shared with other Salesforce tooling (stored in `~/.sfdx`) — including orgs you authorized with the CLI
- Follows the same org-selection rules as the CLI: explicit setting → project default → global default
- Refreshes expired access tokens automatically using the stored refresh token

If you've never authorized an org, run **Salesforce Open Flow: Log in to Org** from the Command Palette (or press the "Log in to Salesforce" button when the extension offers it). It opens your browser, you approve, and the tokens are stored locally — same flow as `sf org login web`, run in-process. The login can also set the project/global default org for you.

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

### 0.3.3
- Fix "Page does not exist" when Flow Builder opened: VS Code's URI handling strips the encoding of the frontdoor URL's `startURL` parameter, breaking the Salesforce redirect. The extension now double-encodes query values so the browser receives exactly the URL Salesforce generated.

### 0.3.2
- Fix org resolution for projects using legacy `.sfdx/sfdx-config.json` and legacy aliases (`~/.sfdx/alias.json`) — e.g. a project whose default org is set as an alias like `KBRILL`.

### 0.3.1
- Fix "Open Flow" failing with a logger transport error when the dependencies were bundled; the extension now ships with its dependencies unpacked (the same approach as the official Salesforce extensions). No functional changes.

### 0.3.0
- **Built-in org login** — new *Salesforce Open Flow: Log in to Org* command runs the full browser OAuth flow in-process (localhost OAuth listener + Salesforce's built-in connected app). The extension is now completely standalone: install it, log in, right-click a flow, done.
- If no org is authorized yet, the "open" command now offers a one-click **Log in to Salesforce** button instead of telling you to install the CLI.

### 0.2.0
- **No more CLI dependency** — talks to Salesforce in-process via the bundled `@salesforce/core`; `sf` no longer needs to be installed or on PATH.
- Org resolution now matches the CLI: project `sfdx-project.json` / local config wins over global default.
- Clearer errors when the flow is missing from the org.

### 0.1.0
- Initial release: Explorer + editor context menus, command palette entry, configurable target org, output panel logging (spawned the `sf` CLI).

---

MIT © Ken Brill · [Wallen Creek Software](https://wallencreeksoftware.com)
