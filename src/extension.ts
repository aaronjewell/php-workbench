// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Global output channel for displaying results
let outputChannel: vscode.OutputChannel;

/**
 * Represents the result of PHP code execution
 *
 * Why: Provides structured response for code execution with output and error handling
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
 * Why: Provides user feedback for code execution without disrupting editor workspace
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
    // Remove <?php tags since php -r runs code directly in PHP context
    let phpCode = code.trim();
    if (phpCode.startsWith('<?php')) {
      phpCode = phpCode.substring(5).trim();
    }

    // Execute PHP code using php -r (run code inline)
    const { stdout, stderr } = await execAsync(`php -r "${phpCode.replace(/"/g, '\\"')}"`);

    if (stderr) {
      return {
        output: '',
        error: stderr,
        success: false,
      };
    }

    return {
      output: stdout,
      success: true,
    };
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

  context.subscriptions.push(disposable, executeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}
