import * as vscode from 'vscode';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  RequestType3,
  MessageConnection,
} from 'vscode-jsonrpc/node';
import * as path from 'path';
import { randomBytes } from 'crypto';

type EvalResponse = {
  stdout: string;
  returnValue: string;
};

export type ExecuteCodeResponse = {
  result?: EvalResponse;
  error?: string;
};

const EvalRequest = new RequestType3<string, string, string, EvalResponse, void>('eval');

let outputChannel: vscode.OutputChannel | undefined;
let webviewPanel: vscode.WebviewPanel | undefined;
let webviewContent: string | undefined;
let connection: MessageConnection | undefined;
let php: ChildProcessWithoutNullStreams | undefined;
let pharPath: string | undefined;
let token: string | undefined;

/**
 * Generates a secure random token for PHP process authentication
 *
 * @returns A cryptographically secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Safely terminates a child process
 *
 * @param process - The child process to terminate
 */
function terminateProcess(process: ChildProcessWithoutNullStreams): void {
  if (!process || process.killed) {
    return;
  }

  process.removeAllListeners('exit');

  try {
    if (!process.kill('SIGTERM')) {
      process.kill('SIGKILL');
    }
  } catch {
    // Ignore errors during cleanup
  }
}

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
    getOutputChannel(context).appendLine(`Failed to stat PHP Workbench PHAR file: ${error}`);
    pharPath = context.asAbsolutePath('bin/workbench');
  }

  getOutputChannel(context).appendLine(`Using PHP Workbench PHAR file: ${pharPath}`);

  context.subscriptions.push(
    new vscode.Disposable(() => {
      getOutputChannel(context).appendLine(
        `Disposing PHP Workbench PHAR file path on subscription disposal`
      );
      pharPath = undefined;
    })
  );

  return pharPath;
}

/**
 * Creates a new JSON-RPC connection to the PHP worker process
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
    getOutputChannel(context).appendLine(
      `Terminating existing PHP worker process on connection recreation`
    );
    terminateProcess(php);
  }

  // Generate a new token for this connection
  token = generateToken();

  try {
    php = spawn('php', [await getPhpEntrypoint(context)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PHP_WORKBENCH_TOKEN: token,
      },
    });
  } catch (error) {
    getOutputChannel(context).appendLine(`Failed to spawn PHP worker process: ${error}`);
    throw error;
  }

  try {
    var conn = createMessageConnection(
      new StreamMessageReader(php.stdout),
      new StreamMessageWriter(php.stdin)
    );
    conn.listen();
    conn.onError(error => {
      getOutputChannel(context).appendLine(`Error in connection to PHP worker process: ${error}`);
    });
    conn.onClose(() => {
      getOutputChannel(context).appendLine(`Connection to PHP worker process closed`);
    });
    conn.onDispose(() => {
      getOutputChannel(context).appendLine(`Connection to PHP worker process disposed`);
    });
  } catch (error) {
    getOutputChannel(context).appendLine(
      `Failed to create connection to PHP worker process: ${error}`
    );
    throw error;
  }

  php.stderr.on('data', data => {
    getOutputChannel(context).append(data.toString());
  });

  php.on('error', error => {
    getOutputChannel(context).appendLine(`Error in PHP worker process: ${error}`);

    conn.dispose();
    if (connection === conn) {
      connection = undefined;
    }
    php = undefined;
    token = undefined;
  });

  php.once('exit', (code: number, signal: string) => {
    getOutputChannel(context).appendLine(
      `Background PHP process exited with code ${code} and signal ${signal}`
    );
    conn.dispose();
    if (connection === conn) {
      connection = undefined;
    }
    php = undefined;
    token = undefined;
  });

  context.subscriptions.push(
    new vscode.Disposable(() => {
      getOutputChannel(context).appendLine(
        `Disposing connection to PHP worker process on subscription disposal`
      );
      conn.dispose();
      if (connection === conn) {
        connection = undefined;
      }
      if (php) {
        if (!php.killed) {
          terminateProcess(php);
        }
        php = undefined;
      }
      token = undefined;
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
            path.dirname(editor.document.uri.fsPath),
          token!
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
  if (php) {
    if (!php.killed) {
      terminateProcess(php);
    }
    php = undefined;
  }

  if (connection) {
    connection.dispose();
    connection = undefined;
  }

  if (webviewPanel) {
    webviewPanel.dispose();
    webviewPanel = undefined;
  }

  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = undefined;
  }

  webviewContent = undefined;
  pharPath = undefined;
  token = undefined;
}
