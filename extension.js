const vscode = require('vscode');
const path = require('path');

const FLOW_EXTENSION = '.flow-meta.xml';
const OUTPUT = () => vscode.window.createOutputChannel('Salesforce Open Flow');

/**
 * Interactive browser login, entirely in-process (no sf CLI).
 * Uses @salesforce/core's WebOAuthServer — a localhost OAuth listener on :1717
 * and Salesforce's built-in connected app, exactly like `sf org login web`.
 * The resulting tokens are stored in the standard shared auth files (~/.sfdx),
 * so the sf CLI and other Salesforce tooling see the org too.
 */
async function loginWeb() {
  const output = OUTPUT();
  output.show(true);
  const instanceUrl = await vscode.window.showInputBox({
    prompt: 'Login URL (accept the default for production / most orgs)',
    value: 'https://login.salesforce.com',
    ignoreFocusOut: true,
  });
  if (!instanceUrl) return;

  output.appendLine(`Starting browser login to ${instanceUrl}…`);
  try {
    const core = require('@salesforce/core');
    const server = await core.WebOAuthServer.create({
      oauthConfig: { loginUrl: instanceUrl.trim() },
    });
    await server.start();
    vscode.env.openExternal(vscode.Uri.parse(server.getAuthorizationUrl()));
    output.appendLine('Waiting for authorization in the browser…');

    const authInfo = await server.authorizeAndSave();
    const username = authInfo.getFields().username;
    output.appendLine(`Logged in as ${username}. Saved to local org list.`);

    const makeDefault = await vscode.window.showInformationMessage(
      `Logged in as ${username}. Set as the default org for this project?`,
      'Yes', 'No'
    );
    if (makeDefault === 'Yes') {
      await authInfo.handleAliasAndDefaultSettings({ setDefault: true });
      output.appendLine('Set as default org.');
    }
  } catch (err) {
    output.appendLine(`Login failed: ${err.message}`);
    vscode.window.showErrorMessage(`Salesforce Open Flow login: ${err.message}`);
  }
}

/**
 * Resolve org credentials: explicit setting > project default (sfdx-project.json /
 * .sfdx/sfdx-config.json) > global default. Uses @salesforce/core's own config
 * aggregation, so it matches `sf` behavior exactly.
 */
async function resolveUsername(config, workspaceRoot) {
  const explicit = config.get('targetOrg');
  if (explicit) {
    return explicit;
  }
  // Mimic `sf`: local project config wins, then global.
  const { ConfigAggregator } = require('@salesforce/core');
  const agg = await ConfigAggregator.create();
  const local = agg.getInfo('defaultusername');
  return local && local.value ? local.value : undefined;
}

async function openFlow(uri) {
  if (!uri || uri.scheme !== 'file') {
    vscode.window.showErrorMessage('Open a Flow metadata file (.flow-meta.xml) first, or right-click one in the Explorer.');
    return;
  }
  const filePath = uri.fsPath;
  if (!filePath.endsWith(FLOW_EXTENSION)) {
    vscode.window.showErrorMessage(`Not a Flow metadata file: ${path.basename(filePath)} (expected ${FLOW_EXTENSION})`);
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('The Flow file is not inside the current workspace.');
    return;
  }
  const workspaceRoot = workspaceFolder.uri.fsPath;

  const output = OUTPUT();
  output.show(true);
  output.appendLine(`Opening ${path.basename(filePath)} in Flow Builder…`);

  try {
    // @salesforce/core is bundled with the extension — no sf CLI required.
    const core = require('@salesforce/core');

    const config = vscode.workspace.getConfiguration('salesforceOpenFlow');
    const username = await resolveUsername(config, workspaceRoot);
    if (!username) {
      const login = await vscode.window.showErrorMessage(
        'No Salesforce org authorized on this machine yet.',
        'Log in to Salesforce'
      );
      if (login === 'Log in to Salesforce') {
        await vscode.commands.executeCommand('salesforceOpenFlow.login');
      }
      return;
    }

    const authInfo = await core.AuthInfo.create({ username });
    const connection = await core.Connection.create({ authInfo });
    const org = await core.Org.create({ connection });
    output.appendLine(`Org: ${org.getUsername()} @ ${connection.instanceUrl}`);

    // Flow api name = file basename without .flow-meta.xml (same resolution as sf org open)
    const flowApiName = path.basename(filePath, FLOW_EXTENSION);

    // Same SOQL the CLI runs to map the file to a Flow Builder DurableId
    let durableId;
    try {
      const flow = await connection.singleRecordQuery(
        `SELECT DurableId FROM FlowVersionView WHERE FlowDefinitionView.ApiName = '${flowApiName}' ` +
        'ORDER BY VersionNumber DESC LIMIT 1'
      );
      durableId = flow.DurableId;
    } catch (err) {
      vscode.window.showErrorMessage(
        `Flow "${flowApiName}" was not found in org ${org.getUsername()}. ` +
        'Deploy the flow first (or check the target org setting).'
      );
      output.appendLine(`Lookup failed: ${err.message}`);
      return;
    }

    // Flow Builder redirect, then the single-use frontdoor URL via the UI Bridge API
    const redirect = `/builder_platform_interaction/flowBuilder.app?flowId=${durableId}`;
    const frontdoorUrl = await org.getFrontDoorUrl(redirect);

    output.appendLine(`DurableId: ${durableId}`);
    vscode.env.openExternal(vscode.Uri.parse(frontdoorUrl));
    output.appendLine('Flow Builder opened in browser.');
  } catch (err) {
    output.appendLine(`Error: ${err.message}`);
    vscode.window.showErrorMessage(`Salesforce Open Flow: ${err.message}`);
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('salesforceOpenFlow.open', async (uri) => {
      // Invoked from the Command Palette → no URI argument; use the active editor.
      if (!uri && vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
      }
      await openFlow(uri);
    }),
    vscode.commands.registerCommand('salesforceOpenFlow.login', loginWeb),
    OUTPUT()
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
