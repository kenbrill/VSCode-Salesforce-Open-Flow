# Salesforce Open Flow for VS Code

Open any Salesforce Flow metadata file directly in **Flow Builder** with one click — no terminal, no typing `sf` commands, **no Salesforce CLI required**.

![Version](https://img.shields.io/badge/version-0.3.4-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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
- **Built-in org login** — *Salesforce: Log in to Org* runs the browser OAuth flow itself; no Salesforce CLI or Extension Pack needed, ever. The command is shared with other Wallencreek Salesforce plugins: install several and you still get a single login entry.
- Logs every step to a dedicated **"Salesforce Open Flow"** output panel

## How it works

The extension bundles [`@salesforce/core`](https://www.npmjs.com/package/@salesforce/core) — the same library the Salesforce CLI is built on — and talks to Salesforce directly:

1. **Pick the org** — the `targetOrg` setting if set, otherwise the default org using the same resolution rules as the CLI: project config (`.sfdx/sfdx-config.json`, both `target-org` and the legacy `defaultusername` key) → global config. Aliases are resolved from both the modern (`~/.sf/alias.json`) and legacy (`~/.sfdx/alias.json`) alias files.
2. **Authenticate** — reads the org's OAuth tokens from the shared auth files in `~/.sfdx`, refreshing expired access tokens automatically. Orgs you've authorized with the CLI or the official extensions just work.
3. **Find the Flow** — one Tooling/REST query maps the file name to the latest deployed version's `DurableId`.
4. **Build the URL** — asks the UI Bridge API (`/services/oauth2/singleaccess`) for a single-use, pre-authenticated Frontdoor URL that lands directly on the Flow Builder canvas.
5. **Open it** — the URL is handed to the **OS browser launcher** (`open` / `start` / `xdg-open`) as a raw string, byte-for-byte, exactly the way the `sf` CLI does. VS Code's own URI handling and link-confirmation dialog are bypassed entirely, so the encoded URL the server signed is the URL the browser receives.

## No CLI required

Nothing in the extension shells out to `sf`:

- **Login** is run in-process via `WebOAuthServer` — a localhost OAuth listener plus Salesforce's built-in connected app, the identical mechanism behind `sf org login web`. Tokens are stored in the standard shared auth files, so the CLI and other Salesforce tooling see the org too.
- **API calls** go straight over HTTPS from the extension host.
- **Browser handoff** goes through the OS, not VS Code.

If you've never authorized an org, run **Salesforce: Log in to Org** from the Command Palette (or press the "Log in to Salesforce" button when the extension offers it). It opens your browser, you approve, and the tokens are stored locally — the login can also set the project/global default org for you.

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
- Frontdoor URLs are single-use; every open mints a fresh one.

## Release Notes

### 0.3.5
- The login command is now shared across Wallencreek Salesforce plugins: it moved to the plugin-agnostic **Salesforce: Log in to Org** (`wallencreekSf.login`), contributed identically by the Apex Picklist Autocomplete extension — install both and the Command Palette still shows a single login entry. Org resolution prefers the new shared `wallencreekSf.targetOrg` setting; `salesforceOpenFlow.targetOrg` still works but is deprecated, and the old `salesforceOpenFlow.login` ID remains registered (hidden) for keybindings and scripts.

### 0.3.4
- Flow Builder URLs are now opened through the OS browser launcher (`open`/`start`/`xdg-open`) instead of `vscode.env.openExternal`, byte-for-byte — the same path the `sf` CLI uses. This removes the link-confirmation dialog and fixes the last "Page does not exist" case, where the dialog's **Open** button mangled the encoded frontdoor URL even though its **Copy** button worked.

### 0.3.3
- Fix "Page does not exist" when Flow Builder opened: VS Code's URI handling strips the encoding of the frontdoor URL's `startURL` parameter, breaking the Salesforce redirect. The extension double-encodes query values so `openExternal` delivers the exact URL Salesforce generated.

### 0.3.2
- Fix org resolution for projects using legacy `.sfdx/sfdx-config.json` and legacy aliases (`~/.sfdx/alias.json`) — e.g. a project whose default org is set as an alias like `KBRILL`.

### 0.3.1
- Fix "Open Flow" failing with a logger transport error when the dependencies were bundled; the extension ships with its dependencies unpacked (the same approach as the official Salesforce extensions). No functional changes.

### 0.3.0
- **Built-in org login** — new *Salesforce: Log in to Org* command runs the full browser OAuth flow in-process (localhost OAuth listener + Salesforce's built-in connected app). The extension is completely standalone: install it, log in, right-click a flow, done.
- If no org is authorized yet, the "open" command offers a one-click **Log in to Salesforce** button instead of telling you to install the CLI.

### 0.2.0
- **No more CLI dependency** — talks to Salesforce in-process via the bundled `@salesforce/core`; `sf` no longer needs to be installed or on PATH.
- Org resolution now matches the CLI: project `sfdx-project.json` / local config wins over global default.
- Clearer errors when the flow is missing from the org.

### 0.1.0
- Initial release: Explorer + editor context menus, command palette entry, configurable target org, output panel logging (spawned the `sf` CLI).

---

MIT © Ken Brill · [Wallen Creek Software](https://wallencreeksoftware.com)
