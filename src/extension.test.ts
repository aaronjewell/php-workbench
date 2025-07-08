// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as assert from 'assert';

import type { ExecuteCodeResponse } from './extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  let extension: vscode.Extension<any>;

  setup(async () => {
    extension = vscode.extensions.getExtension('undefined_publisher.quickmix')!;
    assert.ok(extension);
    await extension.activate();
  });

  test('vscode should be able to get quickmix configuration', async () => {
    assert.ok(vscode.workspace.getConfiguration('quickmix'));
  });

  test('quickmix should have configuration properties defined in package.json', async () => {
    const config = extension.packageJSON.contributes.configuration;

    assert.ok(config);
    assert.equal(config.type, 'object');
    assert.equal(config.title, 'QuickMix');
    assert.ok(config.properties);
  });

  test('quickmix.newScratchpad command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('quickmix.newScratchpad'));
  });

  test('quickmix.newScratchpad command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const quickmixKeybinding = keybindings.find(
      (kb: any) => kb.command === 'quickmix.newScratchpad'
    );

    assert.ok(quickmixKeybinding);
    assert.equal(quickmixKeybinding.key, 'ctrl+alt+n');
    assert.equal(quickmixKeybinding.mac, 'cmd+alt+n');
  });

  test('quickmix.newScratchpad command should create a new untitled PHP file', async () => {
    const initialEditors = vscode.window.visibleTextEditors.length;

    await vscode.commands.executeCommand('quickmix.newScratchpad');

    assert.ok(vscode.window.visibleTextEditors.length > initialEditors);

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor);
    assert.ok(activeEditor!.document.languageId === 'php');
    assert.ok(activeEditor!.document.isUntitled);

    // Verify starter content exists
    const content = activeEditor!.document.getText();
    assert.ok(content.includes('<?php'));

    // Verify cursor is positioned at the end of the content
    const cursorPosition = activeEditor!.selection.active;
    const endPosition = activeEditor!.document.positionAt(activeEditor!.document.getText().length);

    assert.strictEqual(cursorPosition.line, endPosition.line);
    assert.strictEqual(cursorPosition.character, endPosition.character);
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

      assert.ok(errorMessageShown);
      assert.ok(errorMessage.includes('Failed to create scratchpad'));
    } finally {
      // Restore original functions
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });

  // Tests for quickmix.executeCode command - following zero-one-many strategy
  test('quickmix.executeCode command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    assert.ok(commands.includes('quickmix.executeCode'));
  });

  test('quickmix.executeCode command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const executeKeybinding = keybindings.find((kb: any) => kb.command === 'quickmix.executeCode');

    assert.ok(executeKeybinding);
    assert.equal(executeKeybinding.key, 'ctrl+enter');
    assert.equal(executeKeybinding.mac, 'cmd+enter');
    assert.equal(executeKeybinding.when, 'editorTextFocus && resourceLangId == php');
  });

  test('quickmix.executeCode command should execute', async () => {
    assert.doesNotThrow(() => vscode.commands.executeCommand('quickmix.executeCode'));
  });

  test('quickmix.executeCode should execute basic PHP code and return result', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "Hello World";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.equal(response.result!.stdout, 'Hello World');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('quickmix.executeCode should handle empty PHP code', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<string>('quickmix.executeCode');
    assert.ok(result);
  });

  test('quickmix.executeCode should execute multiple PHP statements', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2"; echo "line3";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');
    assert.ok(response);
    assert.equal(response.result!.stdout, 'line1line2line3');
  });

  test('quickmix.executeCode should handle PHP syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php $a;',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.error, 'Undefined variable $a');
    assert.equal(typeof response.result, 'undefined');
  });

  test('quickmix.executeCode should execute PHP without opening tags', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'echo "No opening tag";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.result!.stdout, 'No opening tag');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('quickmix.executeCode should execute PHP without semicolon', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'echo "No semicolon"',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.result!.stdout, 'No semicolon');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  // Tests for multiline content with different line ending variations
  test('quickmix.executeCode should execute multiline PHP with various line endings', async () => {
    // Test Unix line endings (\n)
    const unixDocument = await vscode.workspace.openTextDocument({
      content: '<?php\necho "unix1";\necho "unix2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(unixDocument);
    let response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');
    assert.equal(response.result!.stdout, 'unix1unix2');
    assert.equal(response.result!.returnValue, 'NULL');

    // Test Windows line endings (\r\n)
    const windowsDocument = await vscode.workspace.openTextDocument({
      content: '<?php\r\necho "windows1";\r\necho "windows2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(windowsDocument);
    response = await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');
    assert.equal(response.result!.stdout, 'windows1windows2');
    assert.equal(response.result!.returnValue, 'NULL');

    // Test old Mac line endings (\r)
    const macDocument = await vscode.workspace.openTextDocument({
      content: '<?php\recho "mac1";\recho "mac2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(macDocument);
    response = await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');
    assert.equal(response.result!.stdout, 'mac1mac2');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('quickmix.executeCode should execute complex multiline PHP with mixed statements', async () => {
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

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(
      response.result!.stdout,
      'Extension: QuickMixVersion: 1.0Iteration: 1Iteration: 2Iteration: 3'
    );
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('quickmix.executeCode should handle multiline PHP with syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "line1";
echo "unclosed string
echo "line3";`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(
      response.error,
      `PHP Parse error: Syntax error, unexpected T_STRING, expecting ';' on line 3`
    );
    assert.equal(response.result, undefined);
  });

  test('quickmix.executeCode should execute PHP with complex string content and special characters', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "String with 'single quotes' and \\"double quotes\\"";
echo 'String with "double quotes" and \\'single quotes\\'';
echo "Multiline string with
actual line breaks";
$variable = "interpolation";
echo "Dollar signs and \\$variable contains: $variable"`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.equal(
      response.result!.stdout,
      `String with 'single quotes' and "double quotes"String with "double quotes" and 'single quotes'Multiline string with\nactual line breaksDollar signs and $variable contains: interpolation`
    );
  });

  test('quickmix.executeCode should handle execution when no active editor', async () => {
    // Close any open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.error, 'No active editor');
  });

  // Tests for selection-based code execution - following zero-one-many strategy
  test('quickmix.executeCode should execute selected PHP code when text is selected', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20); // start of: echo "selected";
    const endPos = new vscode.Position(0, 36); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('selected'));
    assert.ok(!response.result!.stdout.includes('first'));
    assert.ok(!response.result!.stdout.includes('last'));
  });

  test('quickmix.executeCode should execute multiline selected PHP code', async () => {
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

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('Selected: QuickMix'));
    assert.ok(!response.result!.stdout.includes('before'));
    assert.ok(!response.result!.stdout.includes('after'));
  });

  test('quickmix.executeCode should execute entire document when no selection', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "second"; echo "third";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const cursorPos = new vscode.Position(0, 0);
    editor.selection = new vscode.Selection(cursorPos, cursorPos);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('first'));
    assert.ok(response.result!.stdout.includes('second'));
    assert.ok(response.result!.stdout.includes('third'));
  });

  test('quickmix.executeCode should add PHP opening tag to selected code without it', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "before"; echo "selected"; echo "after";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    // Select only the middle echo statement without PHP opening tag
    const startPos = new vscode.Position(0, 21); // start of: echo "selected";
    const endPos = new vscode.Position(0, 37); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('selected'));
    assert.ok(!response.result!.stdout.includes('before'));
    assert.ok(!response.result!.stdout.includes('after'));
  });

  // Tests for focus restoration after output display
  test('quickmix.executeCode should keep focus on editor after displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "test";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand<string>('quickmix.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
  });

  test('quickmix.executeCode should preserve cursor position when displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const originalPosition = new vscode.Position(0, 15);
    editor.selection = new vscode.Selection(originalPosition, originalPosition);

    await vscode.commands.executeCommand<string>('quickmix.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
    assert.strictEqual(editor.selection.active.line, originalPosition.line);
    assert.strictEqual(editor.selection.active.character, originalPosition.character);
  });

  test('quickmix.executeCode should preserve selection when displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20);
    const endPos = new vscode.Position(0, 36);
    const originalSelection = new vscode.Selection(startPos, endPos);
    editor.selection = originalSelection;

    await vscode.commands.executeCommand<string>('quickmix.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
    assert.strictEqual(editor.selection.start.line, startPos.line);
    assert.strictEqual(editor.selection.start.character, startPos.character);
    assert.strictEqual(editor.selection.end.line, endPos.line);
    assert.strictEqual(editor.selection.end.character, endPos.character);
  });

  test('quickmix.restartSession should restart session', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '$a = 1;',
      language: 'php',
    });

    const editor = await vscode.window.showTextDocument(document);

    let response =
      await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.result!.returnValue, '1');

    let wasEdited = await editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, '$a = 1;'.length + 1)),
        '++$a;'
      );
    });

    assert.ok(wasEdited);
    assert.equal(editor.document.getText(), '++$a;');

    response = await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.result!.returnValue, '2');

    await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.restartSession');

    wasEdited = await editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, '++$a;'.length)),
        '$a;'
      );
    });

    assert.ok(wasEdited);
    assert.equal(editor.document.getText(), '$a;');

    response = await vscode.commands.executeCommand<ExecuteCodeResponse>('quickmix.executeCode');

    assert.equal(response.error, 'Undefined variable $a');
    assert.equal(typeof response.result, 'undefined');
  });
});
