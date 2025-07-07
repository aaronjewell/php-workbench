import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ExecutionResult } from '../extension';
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

  // Tests for quickmix.executeCode command - following zero-one-many strategy
  test('quickmix.executeCode command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(
      commands.includes('quickmix.executeCode'),
      'quickmix.executeCode command should be registered'
    );
  });

  test('quickmix.executeCode command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const executeKeybinding = keybindings.find((kb: any) => kb.command === 'quickmix.executeCode');

    assert.ok(executeKeybinding, 'Execute keyboard shortcut should be defined in package.json');
    assert.equal(executeKeybinding.key, 'ctrl+enter', 'Keyboard shortcut should be ctrl+enter');
    assert.equal(executeKeybinding.mac, 'cmd+enter', 'Mac keyboard shortcut should be cmd+enter');
    assert.equal(
      executeKeybinding.when,
      'editorTextFocus && resourceLangId == php',
      'Shortcut should only work in PHP files with editor focus'
    );
  });

  test('quickmix.executeCode command should execute', async () => {
    assert.doesNotThrow(
      () => vscode.commands.executeCommand('quickmix.executeCode'),
      'Command should execute successfully'
    );
  });

  test('should execute basic PHP code and return result', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "Hello World";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(result.success, 'Execution should be successful');
    assert.ok(result.output.includes('Hello World'), 'Should contain actual PHP output');
    assert.ok(!result.error, 'Should not contain error');
    assert.notStrictEqual(
      result.output,
      'Code executed successfully (placeholder)',
      'Should not be placeholder'
    );
  });

  test('should handle empty PHP code', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');
    assert.ok(result.success, 'Result should be successful');
    assert.ok(!result.error, 'Result should not contain error');
  });

  test('should execute single PHP statement', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "test";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = (await vscode.commands.executeCommand('quickmix.executeCode')) as any;
    assert.ok(result.success, 'Execution should be successful');
    assert.ok(result.output.includes('test'), 'Result should contain output');
  });

  test('should execute multiple PHP statements', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2"; echo "line3";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');
    assert.ok(result.success, 'Execution should be successful');
    assert.ok(result.output.includes('line1'), 'Result should contain first output');
    assert.ok(result.output.includes('line2'), 'Result should contain second output');
    assert.ok(result.output.includes('line3'), 'Result should contain third output');
  });

  test('should handle PHP syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "unclosed string;',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(result.success, false, 'Result should fail on syntax error');
    assert.ok(result.error, 'Result should contain error message');
  });

  test('should execute PHP without opening tags', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'echo "No opening tag";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(result.success, 'Result should execute PHP without opening tags');
    assert.ok(result.output.includes('No opening tag'), 'Result should contain output');
  });
});
