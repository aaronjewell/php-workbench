import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  RequestType,
  MessageConnection,
} from 'vscode-jsonrpc/node';
import * as fs from 'fs';

type EvalResponse = {
  stdout: string;
  returnValue: string;
};

export type ExecuteCodeResponse = {
  result?: EvalResponse;
  error?: string;
};

const EvalRequest = new RequestType<string, EvalResponse, void>('eval');

let outputChannel: vscode.OutputChannel;
let connection: MessageConnection;
let php: ChildProcessWithoutNullStreams;

/**
 * Displays execution results in the PHP Workbench output panel
 *
 * @param result - The execution result to display
 */
function displayResult(result: ExecuteCodeResponse): void {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('PHP Workbench');
  }

  // Clear previous output and add timestamp
  outputChannel.clear();
  outputChannel.appendLine(
    `--- PHP Workbench Execution (${new Date().toLocaleTimeString()}): ${result.result ? 'Success' : 'Error'} ---`
  );

  outputChannel.appendLine(JSON.stringify(result.result || result.error));

  outputChannel.appendLine('--- End ---');
  outputChannel.show(true); // preserveFocus: true keeps focus on editor
}

function getPhpEntrypoint(context: vscode.ExtensionContext): string {
  const phar = context.asAbsolutePath('out/php-workbench.phar');
  return fs.existsSync(phar) ? phar : context.asAbsolutePath('bin/workbench');
}

function createPhpConnection(context: vscode.ExtensionContext): void {
  if (php && !php.killed) {
    php.removeAllListeners('exit');
    php.kill('SIGKILL');
  }

  php = spawn('php', [getPhpEntrypoint(context)], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  connection = createMessageConnection(
    new StreamMessageReader(php.stdout),
    new StreamMessageWriter(php.stdin)
  );
  connection.listen();

  php.once('exit', (code, signal) => {
    // TODO: Handle the ways that it can exit differently based on the signal and code
    console.warn(`PHP worker exited (${signal ?? code}); respawning`);
    connection.dispose(); // flush pending promises
    createPhpConnection(context); // transparent restart
  });
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "phpWorkbench" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const newScratchpadCommand = vscode.commands.registerCommand(
    'phpWorkbench.newScratchpad',
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

  const restartSessionCommand = vscode.commands.registerCommand(
    'phpWorkbench.restartSession',
    async (): Promise<void> => {
      try {
        createPhpConnection(context);
        vscode.window.showInformationMessage('PHP Workbench: Session restarted');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to restart session: ${error}`);
      }
    }
  );

  const executeCommand = vscode.commands.registerCommand(
    'phpWorkbench.executeCode',
    async (): Promise<ExecuteCodeResponse> => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { error: 'No active editor' };
      }

      try {
        const code = !editor.selection.isEmpty
          ? editor.document.getText(editor.selection)
          : editor.document.getText();

        const result = await connection.sendRequest(EvalRequest, code);
        displayResult({ result });
        return { result };
      } catch (err: any) {
        const error = err instanceof Error ? err.message : String(err);
        displayResult({ error });
        return { error };
      }
    }
  );

  createPhpConnection(context);

  context.subscriptions.push(newScratchpadCommand, executeCommand, restartSessionCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }

  if (php) {
    const success = php.kill();
    if (!success) {
      php.kill('SIGKILL');
    }
  }
}
