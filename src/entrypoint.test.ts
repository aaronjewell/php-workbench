import * as assert from 'assert';
import * as vscode from 'vscode';
import { getPhpEntrypoint } from './entrypoint';

suite('Entrypoint selection', () => {
  const ctx = {
    asAbsolutePath: (relativePath: string) => `${process.cwd()}/${relativePath}`,
  } as unknown as vscode.ExtensionContext;

  test('returns phar when present', async () => {
    const pharUri = vscode.Uri.file((ctx as any).asAbsolutePath('out/php-workbench.phar'));
    await vscode.workspace.fs.createDirectory(vscode.Uri.file((ctx as any).asAbsolutePath('out')));
    try {
      try {
        await vscode.workspace.fs.stat(pharUri);
      } catch {
        await vscode.workspace.fs.writeFile(pharUri, new Uint8Array());
      }

      const entry = await getPhpEntrypoint(ctx);
      assert.ok(entry.endsWith('out/php-workbench.phar'));
    } finally {
      try {
        await vscode.workspace.fs.delete(pharUri);
      } catch {}
    }
  });

  test('falls back to bin/workbench when phar missing', async () => {
    const pharUri = vscode.Uri.file((ctx as any).asAbsolutePath('out/php-workbench.phar'));
    try {
      await vscode.workspace.fs.delete(pharUri);
    } catch {}

    const entry = await getPhpEntrypoint(ctx);
    assert.ok(entry.endsWith('bin/workbench'));
  });
});
