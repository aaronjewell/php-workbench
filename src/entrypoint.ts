import * as vscode from 'vscode';

/**
 * Resolve the PHP Workbench runner entrypoint path.
 *
 * Prefers the packaged PHAR for portability and to remove
 * a runtime dependency on `vendor/`. Falls back to the source script in dev.
 */
export async function getPhpEntrypoint(context: vscode.ExtensionContext): Promise<string> {
  try {
    const pharPath = context.asAbsolutePath('out/php-workbench.phar');
    await vscode.workspace.fs.stat(vscode.Uri.file(pharPath));
    return pharPath;
  } catch {
    return context.asAbsolutePath('bin/workbench');
  }
}
