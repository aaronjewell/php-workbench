// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "quickmix" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('quickmix.newScratchpad', async () => {
    try {
      // Create a temporary PHP file with unique timestamp and random component
      const tempDir = os.tmpdir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `quickmix-scratchpad-${timestamp}-${randomSuffix}.php`;
      const filePath = path.join(tempDir, fileName);

      // Create and open the document
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.file(filePath).with({ scheme: 'untitled' })
      );

      // Show the document in the editor
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create scratchpad: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
