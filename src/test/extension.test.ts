import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('quickmix.newScratchpad command should be registered', async () => {
    // Get all available commands
    const commands = await vscode.commands.getCommands(true);

    // Verify that our command is registered
    assert.ok(
      commands.includes('quickmix.newScratchpad'),
      'quickmix.newScratchpad command should be registered'
    );
  });
});
