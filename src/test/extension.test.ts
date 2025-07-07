import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ExecutionResult } from '../extension';

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
    assert.ok(activeEditor!.document.isUntitled, 'Created document should be untitled');

    // Verify starter content exists
    const content = activeEditor!.document.getText();
    assert.ok(content.includes('<?php'), 'Should contain PHP opening tag');

    // Verify cursor is positioned at the end of the content
    const cursorPosition = activeEditor!.selection.active;
    const endPosition = activeEditor!.document.positionAt(activeEditor!.document.getText().length);

    assert.strictEqual(cursorPosition.line, endPosition.line, 'Cursor should be at the last line');
    assert.strictEqual(
      cursorPosition.character,
      endPosition.character,
      'Cursor should be at the end of the last line'
    );
  });

  test('quickmix.newScratchpad command should handle errors gracefully', async () => {
    // Mock openTextDocument to throw an error
    const originalOpenTextDocument = vscode.workspace.openTextDocument;
    const originalShowErrorMessage = vscode.window.showErrorMessage;
    let errorMessageShown = false;
    let errorMessage = '';

    vscode.workspace.openTextDocument = async () => {
      throw new Error('Document creation error');
    };

    vscode.window.showErrorMessage = async (message: string) => {
      errorMessageShown = true;
      errorMessage = message;
      return message;
    };

    try {
      await vscode.commands.executeCommand('quickmix.newScratchpad');

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

  // Tests for multiline content with different line ending variations
  test('should execute multiline PHP with various line endings', async () => {
    // Test Unix line endings (\n)
    const unixDocument = await vscode.workspace.openTextDocument({
      content: '<?php\necho "unix1";\necho "unix2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(unixDocument);
    const unixResult =
      await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');
    assert.ok(unixResult.success, 'Should execute with Unix line endings');
    assert.ok(unixResult.output.includes('unix1'), 'Should handle Unix line endings');

    // Test Windows line endings (\r\n)
    const windowsDocument = await vscode.workspace.openTextDocument({
      content: '<?php\r\necho "windows1";\r\necho "windows2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(windowsDocument);
    const windowsResult =
      await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');
    assert.ok(windowsResult.success, 'Should execute with Windows line endings');
    assert.ok(windowsResult.output.includes('windows1'), 'Should handle Windows line endings');

    // Test old Mac line endings (\r)
    const macDocument = await vscode.workspace.openTextDocument({
      content: '<?php\recho "mac1";\recho "mac2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(macDocument);
    const macResult = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');
    assert.ok(macResult.success, 'Should execute with old Mac line endings');
    assert.ok(macResult.output.includes('mac1'), 'Should handle old Mac line endings');
  });

  test('should execute complex multiline PHP with mixed statements', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
$name = "QuickMix";
$version = "1.0";
echo "Extension: " . $name;
echo "Version: " . $version;
for ($i = 1; $i <= 3; $i++) {
    echo "Iteration: " . $i;
}`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(
      result.success,
      `Should execute complex multiline PHP code, but failed with error: ${result.error}`
    );
    assert.ok(result.output.includes('Extension: QuickMix'), 'Should contain extension output');
    assert.ok(result.output.includes('Version: 1.0'), 'Should contain version output');
    assert.ok(result.output.includes('Iteration: 1'), 'Should contain loop iteration 1');
    assert.ok(result.output.includes('Iteration: 2'), 'Should contain loop iteration 2');
    assert.ok(result.output.includes('Iteration: 3'), 'Should contain loop iteration 3');
  });

  test('should handle multiline PHP with syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "line1";
echo "unclosed string
echo "line3";`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(result.success, false, 'Should fail on multiline syntax error');
    assert.ok(result.error, 'Should contain error message for multiline syntax error');
  });

  test('should execute PHP with complex string content and special characters', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "String with 'single quotes' and \\"double quotes\\"";
echo 'String with "double quotes" and \\'single quotes\\'';
echo "Multiline string with
actual line breaks";
$variable = "interpolation";
echo "Dollar signs and \$variable contains: " . $variable;`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(
      result.success,
      `Should execute complex string content, but failed with error: ${result.error}`
    );
    assert.ok(result.output.includes('single quotes'), 'Should handle mixed quote types');
    assert.ok(result.output.includes('double quotes'), 'Should handle escaped quotes');
    assert.ok(result.output.includes('Dollar signs'), 'Should handle dollar signs');
    assert.ok(result.output.includes('interpolation'), 'Should handle variable content');
  });

  test('should handle execution when no active editor', async () => {
    // Close any open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(result.success, false, 'Should fail when no active editor');
    assert.ok(result.error?.includes('No active editor'), 'Should provide clear error message');
  });

  // Tests for selection-based code execution - following zero-one-many strategy
  test('should execute selected PHP code when text is selected', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20); // start of: echo "selected";
    const endPos = new vscode.Position(0, 36); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(result.success, 'Selected code execution should be successful');
    assert.ok(result.output.includes('selected'), 'Should contain output from selected code');
    assert.ok(!result.output.includes('first'), 'Should not contain output from unselected code');
    assert.ok(!result.output.includes('last'), 'Should not contain output from unselected code');
  });

  test('should execute multiline selected PHP code', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "before";
$name = "QuickMix";
echo "Selected: " . $name;
echo "after";`,
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(2, 0); // start of: $name = "QuickMix";
    const endPos = new vscode.Position(3, 26); // end of: echo "Selected: " . $name;
    editor.selection = new vscode.Selection(startPos, endPos);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(
      result.success,
      `Multiline selected code execution should be successful, but failed with error: ${result.error}`
    );
    assert.ok(
      result.output.includes('Selected: QuickMix'),
      'Should contain output from selected lines'
    );
    assert.ok(!result.output.includes('before'), 'Should not contain output from unselected lines');
    assert.ok(!result.output.includes('after'), 'Should not contain output from unselected lines');
  });

  test('should execute entire document when no selection', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "second"; echo "third";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const cursorPos = new vscode.Position(0, 0);
    editor.selection = new vscode.Selection(cursorPos, cursorPos);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(result.success, 'Full document execution should be successful');
    assert.ok(result.output.includes('first'), 'Should contain output from entire document');
    assert.ok(result.output.includes('second'), 'Should contain output from entire document');
    assert.ok(result.output.includes('third'), 'Should contain output from entire document');
  });

  test('should add PHP opening tag to selected code without it', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "before"; echo "selected"; echo "after";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    // Select only the middle echo statement without PHP opening tag
    const startPos = new vscode.Position(0, 21); // start of: echo "selected";
    const endPos = new vscode.Position(0, 37); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const result = await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.ok(
      result.success,
      `Selected code without PHP tag should execute successfully, but failed with error: ${result.error}`
    );
    assert.ok(
      result.output.includes('selected'),
      'Should execute selected code with auto-added PHP tag'
    );
    assert.ok(!result.output.includes('before'), 'Should not execute unselected code');
    assert.ok(!result.output.includes('after'), 'Should not execute unselected code');
  });

  // Tests for focus restoration after output display
  test('should restore focus to editor after displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "test";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(
      vscode.window.activeTextEditor,
      editor,
      'Should maintain active editor after execution'
    );
  });

  test('should preserve cursor position after displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const originalPosition = new vscode.Position(0, 15);
    editor.selection = new vscode.Selection(originalPosition, originalPosition);

    await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor, 'Should maintain active editor');
    assert.strictEqual(
      editor.selection.active.line,
      originalPosition.line,
      'Should preserve cursor line'
    );
    assert.strictEqual(
      editor.selection.active.character,
      originalPosition.character,
      'Should preserve cursor character'
    );
  });

  test('should preserve selection after displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20);
    const endPos = new vscode.Position(0, 36);
    const originalSelection = new vscode.Selection(startPos, endPos);
    editor.selection = originalSelection;

    await vscode.commands.executeCommand<ExecutionResult>('quickmix.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor, 'Should maintain active editor');
    assert.strictEqual(
      editor.selection.start.line,
      startPos.line,
      'Should preserve selection start line'
    );
    assert.strictEqual(
      editor.selection.start.character,
      startPos.character,
      'Should preserve selection start character'
    );
    assert.strictEqual(
      editor.selection.end.line,
      endPos.line,
      'Should preserve selection end line'
    );
    assert.strictEqual(
      editor.selection.end.character,
      endPos.character,
      'Should preserve selection end character'
    );
  });
});
