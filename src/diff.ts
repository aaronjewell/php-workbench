import { createHash } from 'crypto';
import * as vscode from 'vscode';

/**
 * Content provider for PHP Workbench diff documents
 */
export class DiffContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange = this._onDidChange.event;

    private content: Map<string, string> = new Map();

    /**
     * Sets content for a given URI
     * @param uri - The URI to set content for
     * @param content - The content to set
     */
    setContent(uri: vscode.Uri, content: string): void {
        this.content.set(uri.toString(), content);
        this._onDidChange.fire(uri);
    }

    /**
     * Provides text document content for the given URI
     * @param uri - The URI to provide content for
     * @returns The content for the URI
     */
    provideTextDocumentContent(uri: vscode.Uri): string {
        return this.content.get(uri.toString()) || '';
    }

    /**
     * Clears stored content to free memory
     */
    clear(): void {
        this.content.clear();
    }

    /**
     * Opens VS Code's native diff editor to compare dirty and cleaned code
     *
     * @param context - The extension context
     * @param dirtyCode - The original dirty code
     * @param cleanedCode - The cleaned code after processing
     */
    async showCodeDiff(
        dirtyCode: string,
        cleanedCode: string
    ): Promise<void> {
        try {
            // Create URIs for the virtual documents using content hash for deterministic uniqueness
            const originalHash = createHash('sha256').update(dirtyCode).digest('hex');
            const processedHash = createHash('sha256').update(cleanedCode).digest('hex');
            const originalUri = vscode.Uri.parse(`php-workbench:${originalHash}.php`);
            const processedUri = vscode.Uri.parse(`php-workbench:${processedHash}.php`);

            // Set content in the provider
            this.setContent(originalUri, dirtyCode);
            this.setContent(processedUri, cleanedCode);

            await vscode.commands.executeCommand(
                'vscode.diff',
                originalUri,
                processedUri,
                'PHP Workbench: Original ↔ Processed',
                {
                    viewColumn: vscode.ViewColumn.Active,
                    preview: true, // won't work if user has disabled preview mode
                }
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to open diff editor: ${errorMessage}`);
        }
    }
}
