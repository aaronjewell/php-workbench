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

  test('quickmix.newScratchpad command should create a new untitled PHP file', async () => {
    const initialEditors = vscode.window.visibleTextEditors.length;

    await vscode.commands.executeCommand('quickmix.newScratchpad');

    assert.ok(
      vscode.window.visibleTextEditors.length > initialEditors,
      'Should create a new editor'
    );

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'Should have an active editor');
    assert.ok(activeEditor!.document.languageId === 'php', 'Created document should be a PHP file');
  });

  test('quickmix.newScratchpad command should handle errors gracefully', async () => {
    // Mock openTextDocument to throw an error
    const originalExecuteCommand = vscode.commands.executeCommand;
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessageShown = false;
    let errorMessage = '';

    vscode.commands.executeCommand = async () => {
      throw new Error('Command execution error');
    };

    vscode.window.showErrorMessage = async (message: string) => {
      errorMessageShown = true;
      errorMessage = message;
      return message;
    };

    try {
      await originalExecuteCommand('quickmix.newScratchpad');

      assert.ok(errorMessageShown, 'Should display error message to user');
      assert.ok(
        errorMessage.includes('Failed to create scratchpad'),
        'Error message should be descriptive'
      );
    } finally {
      // Restore original functions
      vscode.commands.executeCommand = originalExecuteCommand;
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });
});
