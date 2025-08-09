import * as vscode from 'vscode';
import { ExecuteCodeResponse } from './rpc';
import { DiffContentProvider } from './diff';

export class ResultsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'phpWorkbench.results';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _diffProvider: DiffContentProvider
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'showDiff':
          await this._diffProvider.showCodeDiff(message.raw, message.transformed);
          break;
      }
    });
  }

  async displayResult(result: ExecuteCodeResponse): Promise<void> {
    if (!this._view?.visible) {
      this._view?.show?.(true);
    }
    this._view?.webview.postMessage({
      type: 'executionResult',
      data: result,
    });
  }

  async startExecution() {
    if (!this._view) {
      // if the user hasn't opened up the extensions panel, we need to ensure the webview view gets created
      await vscode.commands.executeCommand('workbench.view.extension.phpWorkbench');
    }
    if (!this._view?.visible) {
      this._view?.show?.(true);
    }
    this._view?.webview.postMessage({
      type: 'executionStarted',
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    const nonce = this._getNonce();
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>PHP Workbench Results</title>
                    <link href="${styleUri}" rel="stylesheet">
                </head>
                <body>
                    <div class="header">
                        <div class="title">PHP Workbench Results</div>
                        <div class="status-badge-container">
                            <div id="status-indicator" class="status-badge hidden"></div>
                            <div class="timestamp" id="timestamp"></div>
                        </div>
                    </div>
      
                    <div id="empty-state" class="state-display">
                        <h3>Ready to execute PHP code</h3>
                        <p>
                            Use <strong>Ctrl+Enter</strong> (or <strong>Cmd+Enter</strong> on Mac) to execute your code
                            and see results here.
                        </p>
                    </div>
      
                    <div id="loading" class="state-display loading hidden">Executing PHP code...</div>
      
                    <div id="results" class="content hidden">
                        <div id="output-section" class="section hidden">
                            <div class="section-title">Output</div>
                            <div id="output-content" class="code-block"></div>
                        </div>
      
                        <div id="return-section" class="section hidden">
                            <div class="section-title">Return Value</div>
                            <div id="return-content" class="code-block"></div>
                        </div>
      
                        <div id="error-section" class="section hidden">
                            <div class="section-title">Error</div>
                            <div id="error-content" class="code-block" data-type="error"></div>
                        </div>
      
                        <div id="code-processing-section" class="hidden">
                            <div id="code-processing-notice" class="code-processing-notice" title="Click to see what changes were made prior to being executed" tabindex="0">
                            <span class="code-processing-text">Code was processed before execution</span>
                            </div>
                        </div>
                    </div>
      
                    <script nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>`;
  }

  private _getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
