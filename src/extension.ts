// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { spawn } from 'child_process';

// Global output channel for displaying results
let outputChannel: vscode.OutputChannel;

/**
 * Represents the result of PHP code execution
 */
export interface ExecutionResult {
  /** The output from successful code execution */
  output: string;
  /** Any error messages from failed execution */
  error?: string;
  /** Whether the execution was successful */
  success: boolean;
}

/**
 * Displays execution results in the QuickMix output panel
 *
 * @param result - The execution result to display
 */
function displayResult(result: ExecutionResult): void {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('QuickMix');
  }

  // Clear previous output and add timestamp
  outputChannel.clear();
  outputChannel.appendLine(`--- QuickMix Execution (${new Date().toLocaleTimeString()}) ---`);

  if (result.success) {
    if (result.output) {
      outputChannel.appendLine('Output:');
      outputChannel.appendLine(result.output);
    } else {
      outputChannel.appendLine('Execution completed successfully (no output)');
    }
  } else {
    outputChannel.appendLine('Error:');
    outputChannel.appendLine(result.error || 'Unknown error occurred');
  }

  outputChannel.appendLine('--- End ---');
  outputChannel.show();
}

/**
 * Executes PHP code using the system PHP interpreter
 */
async function executePhpCode(code: string): Promise<ExecutionResult> {
  try {
    // Handle empty code
    if (!code.trim()) {
      return {
        output: '',
        success: true,
      };
    }

    // Prepare PHP code for execution
    // For stdin execution, we keep the <?php tag if present
    let phpCode = code.trim();
    if (!phpCode.startsWith('<?php')) {
      phpCode = '<?php\n' + phpCode;
    }

    // Execute PHP code by piping to stdin
    return new Promise<ExecutionResult>(resolve => {
      const phpProcess = spawn('php', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      phpProcess.stdout.on('data', data => {
        stdout += data.toString();
      });

      phpProcess.stderr.on('data', data => {
        stderr += data.toString();
      });

      phpProcess.on('close', exitCode => {
        if (exitCode !== 0 || stderr) {
          resolve({
            output: '',
            error: stderr || `PHP process exited with code ${exitCode}`,
            success: false,
          });
        } else {
          resolve({
            output: stdout,
            success: true,
          });
        }
      });

      phpProcess.on('error', error => {
        resolve({
          output: '',
          error: error.message || 'Failed to start PHP process',
          success: false,
        });
      });

      // Write the PHP code to stdin and close it
      phpProcess.stdin.write(phpCode);
      phpProcess.stdin.end();
    });
  } catch (error: any) {
    return {
      output: '',
      error: error.message || 'PHP execution failed',
      success: false,
    };
  }
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
  const newScratchpadCommand = vscode.commands.registerCommand(
    'quickmix.newScratchpad',
    async () => {
      try {
        const document = await vscode.workspace.openTextDocument({
          language: 'php',
          content: '<?php\n\n',
        });
        const editor = await vscode.window.showTextDocument(document);

        // Position cursor at the end of the file
        const endPosition = editor.document.positionAt(editor.document.getText().length);
        editor.selection = new vscode.Selection(endPosition, endPosition);
      } catch (error) {
        await vscode.window.showErrorMessage(`Failed to create scratchpad: ${error}`);
      }
    }
  );

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

        const code = !editor.selection.isEmpty
          ? editor.document.getText(editor.selection)
          : editor.document.getText();

        const result = await executePhpCode(code);
        displayResult(result);
        return result;
      } catch (error) {
        const errorResult = {
          output: '',
          error: `Execution failed: ${error}`,
          success: false,
        };
        displayResult(errorResult);
        return errorResult;
      }
    }
  );

  context.subscriptions.push(newScratchpadCommand, executeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}
