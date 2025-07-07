// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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
 * Manages PsySH .phar file operations
 */
export interface PsyShManager {
  /** Get the path to the PsySH .phar file */
  getPsyShPath(): Promise<string>;
  /** Check if PsySH .phar file exists */
  psyShExists(): Promise<boolean>;
  /** Download PsySH .phar file if needed */
  ensurePsyShAvailable(): Promise<string>;
}

/**
 * Implementation of PsySH .phar file management
 */
export class PsyShManagerImpl implements PsyShManager {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async getPsyShPath(): Promise<string> {
    const config = vscode.workspace.getConfiguration('quickmix');
    const customPath = config.get<string>('psyshPath');

    if (customPath && customPath.trim()) {
      return customPath.trim();
    }

    // Default to extension storage path
    return path.join(this.context.globalStorageUri.fsPath, 'psysh.phar');
  }

  async psyShExists(): Promise<boolean> {
    try {
      const psyshPath = await this.getPsyShPath();
      await fs.promises.access(psyshPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async ensurePsyShAvailable(): Promise<string> {
    const psyshPath = await this.getPsyShPath();

    if (await this.psyShExists()) {
      return psyshPath;
    }

    // For now, return the path even if file doesn't exist
    // Download functionality will be implemented in next step
    return psyshPath;
  }
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
  outputChannel.show(true); // preserveFocus: true keeps focus on editor
}

/**
 * Executes PHP code using the system PHP interpreter
 */
async function executePhpCode(code: string): Promise<ExecutionResult> {
  try {
    let phpCode = code.trim();

    if (!phpCode) {
      return {
        output: '',
        success: true,
      };
    }

    // Prepare PHP code for execution
    // For stdin execution, we keep the <?php tag if present
    // We would drop the tag if using the command line `php -r`
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

/**
 * Manages interactive PsySH session
 */
export interface PHPInteractiveSession {
  /** Start the interactive session */
  start(): Promise<void>;
  /** Execute PHP code in the session */
  executeCode(code: string): Promise<ExecutionResult>;
  /** Stop the interactive session */
  stop(): Promise<void>;
  /** Check if session is running */
  isRunning(): boolean;
  /** Restart the session */
  restart(): Promise<void>;
}

/**
 * Implementation of interactive PsySH session management
 */
export class PHPInteractiveSessionImpl implements PHPInteractiveSession {
  private process: any = null;
  private readonly psyshManager: PsyShManager;
  private readonly workspaceRoot: string;

  constructor(psyshManager: PsyShManager, workspaceRoot: string) {
    this.psyshManager = psyshManager;
    this.workspaceRoot = workspaceRoot;
  }

  async start(): Promise<void> {
    if (this.isRunning()) {
      return; // Already running
    }

    const psyshPath = await this.psyshManager.ensurePsyShAvailable();

    // For now, just mark as started without actually spawning
    // Process spawning will be implemented in next step
    this.process = { dummy: true };
  }

  async executeCode(code: string): Promise<ExecutionResult> {
    if (!this.isRunning()) {
      await this.start();
    }

    // For now, return placeholder result
    // Actual execution will be implemented in next step
    return {
      output: `Interactive execution: ${code}`,
      success: true,
    };
  }

  async stop(): Promise<void> {
    if (this.process) {
      // For now, just clear the process reference
      // Actual process termination will be implemented in next step
      this.process = null;
    }
  }

  isRunning(): boolean {
    return this.process !== null;
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
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
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return {
          output: '',
          error: 'No active editor found',
          success: false,
        };
      }

      try {
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
