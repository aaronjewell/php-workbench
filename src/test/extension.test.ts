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

  test('quickmix.newScratchpad command should execute successfully when triggered', async () => {
    // Test that the command can be executed (this verifies the command
    // registration that the keyboard shortcut depends on)
    let commandExecuted = false;
    const originalShowInformationMessage = vscode.window.showInformationMessage;

    // Mock the showInformationMessage to capture command execution
    vscode.window.showInformationMessage = (message: string) => {
      if (message.includes('QuickMix')) {
        commandExecuted = true;
      }
      return originalShowInformationMessage(message);
    };

    try {
      await vscode.commands.executeCommand('quickmix.newScratchpad');

      assert.ok(commandExecuted, 'Command should execute successfully when triggered');
    } finally {
      // Restore original function
      vscode.window.showInformationMessage = originalShowInformationMessage;
    }
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
});
