import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  let extension: vscode.Extension<any>;

  setup(async () => {
    // Activate the extension before each test
    extension = vscode.extensions.getExtension('undefined_publisher.quickmix')!;
    assert.ok(extension, 'Extension should be found by id');
    await extension.activate();
  });

  test('quickmix.newScratchpad command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(
      commands.includes('quickmix.newScratchpad'),
      'quickmix.newScratchpad command should be registered'
    );
  });

  test('quickmix.newScratchpad command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const quickmixKeybinding = keybindings.find(
      (kb: any) => kb.command === 'quickmix.newScratchpad'
    );

    assert.ok(quickmixKeybinding, 'Keyboard shortcut should be defined in package.json');
    assert.equal(quickmixKeybinding.key, 'ctrl+alt+n', 'Keyboard shortcut should be ctrl+alt+n');
    assert.equal(quickmixKeybinding.mac, 'cmd+alt+n', 'Keyboard shortcut should be cmd+alt+n');
  });

  test('quickmix.newScratchpad command should create a temporary PHP file', async () => {
    const initialDocuments = vscode.workspace.textDocuments.length;

    await vscode.commands.executeCommand('quickmix.newScratchpad');

    // Should have one more document open
    assert.ok(
      vscode.workspace.textDocuments.length > initialDocuments,
      'Should create a new document'
    );

    // The new document should be a PHP file
    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'Should have an active editor');
    assert.ok(activeEditor!.document.languageId === 'php', 'Created document should be a PHP file');
    assert.ok(
      activeEditor!.document.fileName.endsWith('.php'),
      'Created file should have .php extension'
    );
  });

  test('quickmix.newScratchpad command should handle errors gracefully', async () => {
    // Mock openTextDocument to throw an error
    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessageShown = false;
    let errorMessage = '';

    vscode.workspace.openTextDocument = () => {
      throw new Error('Mock file creation error');
    };

    vscode.window.showErrorMessage = (message: string) => {
      errorMessageShown = true;
      errorMessage = message;
      return originalShowErrorMessage(message);
    };

    try {
      await vscode.commands.executeCommand('quickmix.newScratchpad');

      // Should show error message to user
      assert.ok(errorMessageShown, 'Should display error message to user');
      assert.ok(
        errorMessage.includes('Failed to create scratchpad'),
        'Error message should be descriptive'
      );
    } finally {
      // Restore original functions
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });

  test('quickmix.newScratchpad command should generate unique file names', async () => {
    // Create multiple scratchpads quickly to test uniqueness
    const fileNames = new Set<string>();
    const promises = [];

    // Create 3 scratchpads simultaneously to test timestamp uniqueness
    for (let i = 0; i < 3; i++) {
      promises.push(vscode.commands.executeCommand('quickmix.newScratchpad'));
    }

    await Promise.all(promises);

    // Collect file names from all open documents
    vscode.workspace.textDocuments.forEach(doc => {
      if (doc.fileName.includes('quickmix-scratchpad')) {
        fileNames.add(doc.fileName);
      }
    });

    // Should have unique file names (at least as many as we created)
    assert.ok(
      fileNames.size >= 3,
      `Should generate unique file names, got ${fileNames.size} unique names`
    );
  });

  test('quickmix.newScratchpad command should create document with untitled scheme', async () => {
    await vscode.commands.executeCommand('quickmix.newScratchpad');

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'Should have an active editor');

    const document = activeEditor!.document;

    // Verify the document is untitled (not saved to disk)
    assert.ok(document.isUntitled, 'Document should be untitled');
    assert.equal(document.languageId, 'php', 'Document should have PHP language ID');

    // Verify the URI scheme
    assert.equal(document.uri.scheme, 'untitled', 'Document URI should use untitled scheme');
  });
});
