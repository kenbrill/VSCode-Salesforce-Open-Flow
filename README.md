# Salesforce Open Flow for VS Code

Open any Salesforce Flow metadata file directly in **Flow Builder** with one click — no terminal, no typing `sf` commands.

![Version](https://img.shields.io/badge/version-0.1.0-blue) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What it does

When you're working in a Salesforce DX project, jumping from a Flow's source XML to its canvas in Flow Builder means running:

```bash
sf org open --source-file force-app/main/default/flows/My_Flow.flow-meta.xml
```

This extension does that for you:

- **Right-click any `.flow-meta.xml` file** in the Explorer → *Salesforce: Open Flow in Flow Builder*
- **Right-click inside an open Flow metadata file** → same command
- **Command Palette** → *Salesforce: Open Flow in Flow Builder* (uses the active editor)
- Streams `sf` output into a dedicated **"Salesforce Open Flow"** output panel so you can see exactly what ran and why, if anything went wrong

## Requirements

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf` v2+) installed and on your PATH
- An authorized org (`sf org login web`) — the org marked as default is used, unless you configure `salesforceOpenFlow.targetOrg`
- The Flow file must live inside the current workspace (it is passed to `sf` as a workspace-relative path)

## Extension Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `salesforceOpenFlow.targetOrg` | `string` | `""` | Target org username or alias. Leave empty to use the Salesforce CLI default org. |
| `salesforceOpenFlow.sfPath` | `string` | `"sf"` | Absolute path to the `sf` executable, if it is not on the extension host's PATH. |

## Known behavior

- The command is only offered on files ending in `.flow-meta.xml` — the same metadata that `sf org open --source-file` accepts for Flow (it also accepts ApexPage / FlexiPage / Agent metadata; point those at the CLI directly for now).
- `sf org open` asks the org to build the Flow and opens a browser tab to Flow Builder. First open after a deploy can take a few seconds while Salesforce compiles the metadata.

## Release Notes

### 0.1.0
- Initial release: Explorer + editor context menus, command palette entry, configurable target org and sf path, output panel logging.

---

MIT © Ken Brill · [Wallen Creek Software](https://wallencreeksoftware.com)
