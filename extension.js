const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

const FLOW_EXTENSION = '.flow-meta.xml';

function activate(context) {
  const openFlow = vscode.commands.registerCommand(
    'salesforceOpenFlow.open',
    async (item) => {
      // Accept a file from the Explorer context menu or fall back to the active editor
      const uri = item && item.fsPath ? item : vscode.window.activeTextEditor?.document.uri;
      if (!uri || uri.scheme !== 'file') {
        vscode.window.showErrorMessage('Open a Flow metadata file (.flow-meta.xml) first.');
        return;
      }

      const filePath = uri.fsPath;
      if (!filePath.endsWith(FLOW_EXTENSION)) {
        vscode.window.showErrorMessage(
          `Not a Flow metadata file: ${path.basename(filePath)} (expected ${FLOW_EXTENSION})`
        );
        return;
      }

      // sf org open --source-file expects a project-relative path
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('The Flow file is not inside the current workspace.');
        return;
      }
      const relPath = path.relative(workspaceFolder.uri.fsPath, filePath).split(path.sep).join('/');

      const config = vscode.workspace.getConfiguration('salesforceOpenFlow');
      const sfPath = config.get('sfPath', 'sf');
      const targetOrg = config.get('targetOrg', '');

      const args = ['org', 'open', '--source-file', relPath];
      if (targetOrg) {
        args.push('--target-org', targetOrg);
      }

      const output = vscode.window.createOutputChannel('Salesforce Open Flow');
      output.appendLine(`> ${sfPath} ${args.join(' ')}`);
      output.show(true);

      const child = spawn(sfPath, args, { cwd: workspaceFolder.uri.fsPath });

      child.stdout.on('data', (data) => output.append(String(data)));
      child.stderr.on('data', (data) => output.append(String(data)));

      child.on('error', (err) => {
        output.appendLine(`Failed to launch ${sfPath}: ${err.message}`);
        vscode.window.showErrorMessage(
          `Could not run "${sfPath}". Set "Salesforce Open Flow: Sf Path" in settings if sf is not on your PATH.`
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          output.appendLine('Flow Builder opened.');
        } else {
          output.appendLine(`sf exited with code ${code}`);
          vscode.window.showErrorMessage(
            `sf org open failed (exit ${code}). Check the "Salesforce Open Flow" output panel.`
          );
        }
      });
    }
  );

  context.subscriptions.push(openFlow);
}

function deactivate() {}

module.exports = { activate, deactivate };
