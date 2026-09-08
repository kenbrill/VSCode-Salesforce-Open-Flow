const vscode = require('vscode');
const path = require('path');

const FLOW_EXTENSION = '.flow-meta.xml';
const OUTPUT = () => vscode.window.createOutputChannel('Salesforce Open Flow');

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
      vscode.window.showErrorMessage(
        'No default Salesforce org found. Run "sf org login web" once, or set "Salesforce Open Flow: Target Org".'
      );
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
    vscode.commands.registerCommand('salesforceOpenFlow.open', openFlow),
    OUTPUT()
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
