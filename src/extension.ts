import * as vscode from 'vscode';
import { DiffContentProvider } from './diff';
import { ExecuteCodeResponse, RpcServer } from './rpc';
import { getPhpEntrypoint } from './entrypoint';
import path from 'node:path';
import { Session } from './session';
import { ResultsViewProvider } from './results';
import { Logger } from './logger';

let rpc: RpcServer | undefined;

async function createRpcServer(context: vscode.ExtensionContext): Promise<RpcServer> {
  if (rpc) {
    rpc.dispose();
  }

  const entrypoint = await getPhpEntrypoint(context);
  Logger.info(`Using entrypoint: ${entrypoint}`);

  const config = vscode.workspace.getConfiguration('phpWorkbench');
  const debugEnabled = config.get<boolean>('debug');
  const logFile = config.get<string>('logFile');
  const timeout = config.get<number>('timeout');

  if (debugEnabled) {
    Logger.info(`Debug enabled`);
  }
  if (logFile) {
    Logger.info(`Log file: ${logFile}`);
  }

  const cwd =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
    path.dirname(vscode.window.activeTextEditor?.document.uri.fsPath || '');
  Logger.info(`Using cwd: ${cwd}`);

  const session = new Session({
    command: 'php',
    args: [entrypoint],
    env: {
      ...process.env,
      ...(debugEnabled ? { PHP_WORKBENCH_DEBUG: '1' } : {}),
      ...(logFile ? { PHP_WORKBENCH_LOG: logFile } : {}),
      ...(timeout ? { PHP_WORKBENCH_TIMEOUT: timeout.toString() } : {}),
    },
    cwd,
  });

  Logger.info('Executing background session task');
  const execution = await vscode.tasks.executeTask(session.task!);

  rpc = new RpcServer(session);

  await rpc.listen();
  Logger.info(`RPC server listening`);

  rpc.onDidError(error => {
    vscode.window.showErrorMessage(`PHP Workbench: ${error}`);
    execution.terminate();
    rpc = undefined;
  });

  rpc.onDidExit(code => {
    vscode.window.showInformationMessage(`PHP Workbench: Session exited with code ${code}`);
    execution.terminate();
    rpc = undefined;
  });

  return rpc;
}

/**
 * Called by VS Code when the extension is activated.
 *
 * Registers the commands for the PHP Workbench extension.
 *
 * @param context - The extension context
 */
export function activate(context: vscode.ExtensionContext) {
  const diffProvider = new DiffContentProvider();

  const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(
    'php-workbench',
    diffProvider
  );

  const resultsViewProvider = new ResultsViewProvider(context.extensionUri, diffProvider);

  const resultsViewRegistration = vscode.window.registerWebviewViewProvider(
    'phpWorkbench.results',
    resultsViewProvider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );

  // The commandId parameter must match the command field in package.json
  const newScratchpadCommand = vscode.commands.registerCommand(
    'phpWorkbench.newScratchpad',
    async () => {
      try {
        if (!rpc) {
          rpc = await createRpcServer(context);
        }

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
        await createRpcServer(context);
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
        const code = !editor.selection.isEmpty
          ? editor.document.getText(editor.selection)
          : editor.document.getText();

        await resultsViewProvider.startExecution();

        if (!rpc) {
          rpc = await createRpcServer(context);
        }

        const cwd =
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
          path.dirname(vscode.window.activeTextEditor?.document.uri.fsPath || '');

        const result = await rpc.eval(code, cwd);

        await resultsViewProvider.displayResult({ result });
        return { result };
      } catch (err: any) {
        const error = err instanceof Error ? err.message : String(err);
        await resultsViewProvider.displayResult({ error });
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
    reportIssueCommand,
    providerRegistration,
    resultsViewRegistration
  );
}

/**
 * Called by VS Code when the extension is deactivated.
 */
export function deactivate() {
  if (rpc) {
    rpc.dispose();
    rpc = undefined;
  }
  Logger.dispose();
}
