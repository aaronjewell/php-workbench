import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  RequestType2,
  MessageConnection,
} from 'vscode-jsonrpc/node';
import * as path from 'path';

type EvalResponse = {
  stdout: string;
  returnValue: string;
};

export type ExecuteCodeResponse = {
  result?: EvalResponse;
  error?: string;
};

const EvalRequest = new RequestType2<string, string, EvalResponse, void>('eval');

let outputChannel: vscode.OutputChannel | undefined;
let webviewPanel: vscode.WebviewPanel | undefined;
let webviewContent: string | undefined;
let connection: MessageConnection | undefined;
let php: ChildProcessWithoutNullStreams | undefined;
let pharPath: string | undefined;

/**
 * Gets the cached webview panel for the PHP Workbench results
 *
 * @param context - The extension context
 * @returns The webview panel for the PHP Workbench results
 */
async function getWebviewPanel(context: vscode.ExtensionContext): Promise<vscode.WebviewPanel> {
  if (webviewPanel) {
    return webviewPanel;
  }

  webviewPanel = vscode.window.createWebviewPanel(
    'phpWorkbench.results',
    'PHP Workbench Results',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  webviewPanel.webview.html = await getWebviewContent(context);

  webviewPanel.onDidDispose(function (this: vscode.WebviewPanel) {
    if (webviewPanel === this) {
      webviewPanel = undefined;
    }
  }, webviewPanel);

  context.subscriptions.push(webviewPanel);

  return webviewPanel;
}

/**
 * Gets the cached HTML content for the PHP Workbench results webview
 *
 * @param context - The extension context
 * @returns The HTML content for the PHP Workbench results webview
 */
async function getWebviewContent(context: vscode.ExtensionContext): Promise<string> {
  if (webviewContent) {
    return webviewContent;
  }
  const buf = await vscode.workspace.fs.readFile(
    vscode.Uri.file(context.asAbsolutePath('out/webview.html'))
  );
  webviewContent = new TextDecoder('utf-8').decode(buf);

  context.subscriptions.push(
    new vscode.Disposable(() => {
      webviewContent = undefined;
    })
  );

  return webviewContent;
}

/**
 * Gets the cached output channel for the PHP Workbench extension
 *
 * @returns The output channel for the PHP Workbench extension
 */
function getOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
  if (outputChannel) {
    return outputChannel;
  }

  const channel = vscode.window.createOutputChannel('PHP Workbench');

  context.subscriptions.push(
    new vscode.Disposable(() => {
      channel.dispose();
      outputChannel = undefined;
    })
  );

  outputChannel = channel;

  return channel;
}

/**
 * Gets the cached path to the PHP Workbench PHAR file
 *
 * @param context - The extension context
 * @returns The path to the PHP Workbench PHAR file
 */
async function getPhpEntrypoint(context: vscode.ExtensionContext): Promise<string> {
  if (pharPath) {
    return pharPath;
  }
  try {
    pharPath = context.asAbsolutePath('out/php-workbench.phar');
    await vscode.workspace.fs.stat(vscode.Uri.file(pharPath));
  } catch (error) {
    pharPath = context.asAbsolutePath('bin/workbench');
  }

  context.subscriptions.push(
    new vscode.Disposable(() => {
      pharPath = undefined;
    })
  );

  return pharPath;
}

/**
 * Creates a new JSON-RPC connection to the PHP worker process
 *
 * Cleans up any existing PHP worker process before creating a new one
 * by sending a SIGKILL signal to the existing process.
 *
 * @param context - The extension context
 * @param recreate - Whether to recreate the connection if it already exists
 * @returns The JSON-RPC connection to the PHP worker process
 */
async function getPhpConnection(
  context: vscode.ExtensionContext,
  recreate: boolean = false
): Promise<MessageConnection> {
  if (connection && !recreate) {
    return connection;
  }

  if (php && !php.killed) {
    php.removeAllListeners('exit');
    php.kill('SIGKILL');
  }

  php = spawn('php', [await getPhpEntrypoint(context)], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const conn = createMessageConnection(
    new StreamMessageReader(php.stdout),
    new StreamMessageWriter(php.stdin)
  );
  conn.listen();

  php.once('exit', (code, signal) => {
    // TODO: Handle the ways that it can exit differently based on the signal and code
    console.warn(`PHP worker exited (${signal ?? code}); respawning`);
    conn.dispose();
    if (connection === conn) {
      connection = undefined;
    }
  });

  context.subscriptions.push(
    new vscode.Disposable(() => {
      conn.dispose();
      if (connection) {
        connection = undefined;
      }

      if (php) {
        php.removeAllListeners('exit');
        if (!php.kill()) {
          php.kill('SIGKILL');
        }
        php = undefined;
      }
    })
  );

  connection = conn;

  return connection;
}

/**
 * Displays execution results in both the PHP Workbench webview and output channel
 *
 * @param context - The extension context
 * @param result - The execution result to display
 */
async function displayResult(
  context: vscode.ExtensionContext,
  result: ExecuteCodeResponse
): Promise<void> {
  const channel = getOutputChannel(context);

  channel.appendLine(
    `--- PHP Workbench Execution (${new Date().toLocaleTimeString()}): ${result.result ? 'Success' : 'Error'} ---`
  );

  if (result.error) {
    channel.appendLine('Error:');
    channel.appendLine(result.error);
  } else if (result.result) {
    if (result.result.stdout) {
      channel.appendLine('Output:');
      channel.appendLine(result.result.stdout);
    }
    if (result.result.returnValue) {
      channel.appendLine('Return Value:');
      channel.appendLine(result.result.returnValue);
    }
  }

  channel.appendLine('--- End ---');

  const panel = await getWebviewPanel(context);
  if (!panel.visible) {
    panel.reveal(vscode.ViewColumn.Beside, true);
  }
  panel.webview.postMessage({
    type: 'executionResult',
    data: result,
  });
}

/**
 * Called by VS Code when the extension is activated, the very first time a command is executed.
 *
 * Registers the commands for the PHP Workbench extension.
 *
 * @param context - The extension context
 */
export function activate(context: vscode.ExtensionContext) {
  // The commandId parameter must match the command field in package.json
  const newScratchpadCommand = vscode.commands.registerCommand(
    'phpWorkbench.newScratchpad',
    async () => {
      try {
        // preload the webview content to reduce the initial load time
        await getWebviewContent(context);

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
        await getPhpConnection(context, true);
        vscode.window.showInformationMessage('PHP Workbench: Session restarted');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to restart session: ${error}`);
      }
    }
  );

  const executeCodeCommand = vscode.commands.registerCommand(
    'phpWorkbench.executeCode',
    async (): Promise<ExecuteCodeResponse> => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { error: 'No active editor' };
      }

      try {
        const [conn, panel] = await Promise.all([
          getPhpConnection(context),
          getWebviewPanel(context),
        ]);

        const code = !editor.selection.isEmpty
          ? editor.document.getText(editor.selection)
          : editor.document.getText();

        panel.webview.postMessage({
          type: 'executionStarted',
        });

        const result = await conn.sendRequest(
          EvalRequest,
          code,
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
            path.dirname(editor.document.uri.fsPath)
        );
        await displayResult(context, { result });
        return { result };
      } catch (err: any) {
        const error = err instanceof Error ? err.message : String(err);
        await displayResult(context, { error });
        return { error };
      }
    }
  );

  const reportIssueCommand = vscode.commands.registerCommand(
    'phpWorkbench.reportIssue',
    async (): Promise<void> => {
      const issueBodyBuffer = await vscode.workspace.fs.readFile(
        vscode.Uri.file(context.asAbsolutePath('res/issue-report.md'))
      );

      return vscode.commands.executeCommand('workbench.action.openIssueReporter', {
        extensionId: 'aaronjewell.php-workbench',
        issueBody: issueBodyBuffer.toString(),
      });
    }
  );

  context.subscriptions.push(
    newScratchpadCommand,
    executeCodeCommand,
    restartSessionCommand,
    reportIssueCommand
  );
}

/**
 * Called by VS Code when the extension is deactivated.
 */
export function deactivate() {
  // Thank you for using PHP Workbench!
}
