// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

/**
 * Represents the result of PHP code execution
 *
 * Why: Provides structured response for code execution with output and error handling
 */
interface ExecutionResult {
  /** The output from successful code execution */
  output: string;
  /** Any error messages from failed execution */
  error?: string;
  /** Whether the execution was successful */
  success: boolean;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "quickmix" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('quickmix.newScratchpad', async () => {
    try {
      await vscode.commands.executeCommand('workbench.action.files.newUntitledFile', {
        languageId: 'php',
      });
    } catch (error) {
      await vscode.window.showErrorMessage(`Failed to create scratchpad: ${error}`);
    }
  });

  const executeCommand = vscode.commands.registerCommand(
    'quickmix.executeCode',
    async (): Promise<ExecutionResult> => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return {
            output: '',
            error: 'No active editor found',
            success: false,
          };
        }

        const code = editor.document.getText();

        // Minimal implementation - return basic success result for now
        // Will be expanded with actual PHP execution in subsequent steps
        return {
          output: 'Code executed successfully (placeholder)',
          success: true,
        };
      } catch (error) {
        return {
          output: '',
          error: `Execution failed: ${error}`,
          success: false,
        };
      }
    }
  );

  context.subscriptions.push(disposable, executeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
