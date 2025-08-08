import * as vscode from 'vscode';
import * as assert from 'assert';

import type { ExecuteCodeResponse } from './rpc';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  let extension: vscode.Extension<any>;

  setup(async () => {
    extension = vscode.extensions.getExtension('aaronjewell.php-workbench')!;
    assert.ok(extension);
  });

  test('vscode should be able to get phpWorkbench configuration', async () => {
    assert.ok(vscode.workspace.getConfiguration('phpWorkbench'));
  });

  test('phpWorkbench should have configuration properties defined in package.json', async () => {
    const config = extension.packageJSON.contributes.configuration;

    assert.ok(config);
    assert.equal(config.type, 'object');
    assert.equal(config.title, 'PHP Workbench');
    assert.ok(config.properties);
  });

  test('phpWorkbench.newScratchpad command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const phpWorkbenchKeybinding = keybindings.find(
      (kb: any) => kb.command === 'phpWorkbench.newScratchpad'
    );

    assert.ok(phpWorkbenchKeybinding);
    assert.equal(phpWorkbenchKeybinding.key, 'ctrl+alt+n');
    assert.equal(phpWorkbenchKeybinding.mac, 'cmd+alt+n');
  });

  test('phpWorkbench.newScratchpad command should create a new untitled PHP file', async () => {
    const initialEditors = vscode.window.visibleTextEditors.length;

    await vscode.commands.executeCommand('phpWorkbench.newScratchpad');

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

  test('phpWorkbench.newScratchpad command should handle errors gracefully', async () => {
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
      await vscode.commands.executeCommand('phpWorkbench.newScratchpad');

      assert.ok(errorMessageShown);
      assert.ok(errorMessage.includes('Failed to create scratchpad'));
    } finally {
      // Restore original functions
      vscode.workspace.openTextDocument = originalOpenTextDocument;
      vscode.window.showErrorMessage = originalShowErrorMessage;
    }
  });

  test('phpWorkbench.executeCode command should be defined as keyboard shortcut in package.json', async () => {
    const keybindings = await extension.packageJSON.contributes.keybindings;

    const executeKeybinding = keybindings.find(
      (kb: any) => kb.command === 'phpWorkbench.executeCode'
    );

    assert.ok(executeKeybinding);
    assert.equal(executeKeybinding.key, 'ctrl+enter');
    assert.equal(executeKeybinding.mac, 'cmd+enter');
    assert.equal(executeKeybinding.when, 'editorTextFocus && resourceLangId == php');
  });

  test('phpWorkbench.executeCode command should execute', async () => {
    assert.doesNotThrow(() => vscode.commands.executeCommand('phpWorkbench.executeCode'));
  });

  test('phpWorkbench.executeCode should execute basic PHP code and return result', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "Hello World";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.equal(response.result!.stdout, 'Hello World');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('phpWorkbench.executeCode should handle empty PHP code', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const result = await vscode.commands.executeCommand<string>('phpWorkbench.executeCode');
    assert.ok(result);
  });

  test('phpWorkbench.executeCode should execute multiple PHP statements', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2"; echo "line3";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );
    assert.ok(response);
    assert.equal(response.result!.stdout, 'line1line2line3');
  });

  test('phpWorkbench.executeCode should handle PHP syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php $a;',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.error, 'Undefined variable $a');
    assert.equal(typeof response.result, 'undefined');
  });

  test('phpWorkbench.executeCode should execute PHP without opening tags', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'echo "No opening tag";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.result!.stdout, 'No opening tag');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('phpWorkbench.executeCode should execute PHP without semicolon', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'echo "No semicolon"',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.result!.stdout, 'No semicolon');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  // Tests for multiline content with different line ending variations
  test('phpWorkbench.executeCode should execute multiline PHP with various line endings', async () => {
    // Test Unix line endings (\n)
    const unixDocument = await vscode.workspace.openTextDocument({
      content: '<?php\necho "unix1";\necho "unix2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(unixDocument);
    let response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );
    assert.equal(response.result!.stdout, 'unix1unix2');
    assert.equal(response.result!.returnValue, 'NULL');

    // Test Windows line endings (\r\n)
    const windowsDocument = await vscode.workspace.openTextDocument({
      content: '<?php\r\necho "windows1";\r\necho "windows2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(windowsDocument);
    response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );
    assert.equal(response.result!.stdout, 'windows1windows2');
    assert.equal(response.result!.returnValue, 'NULL');

    // Test old Mac line endings (\r)
    const macDocument = await vscode.workspace.openTextDocument({
      content: '<?php\recho "mac1";\recho "mac2";',
      language: 'php',
    });
    await vscode.window.showTextDocument(macDocument);
    response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );
    assert.equal(response.result!.stdout, 'mac1mac2');
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('phpWorkbench.executeCode should handle infinite loops with a timeout', async function () {
    this.timeout(5000);
    const document = await vscode.workspace.openTextDocument({
      content: '<?php while(true);',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.error!.includes('Execution timed out'));
    assert.equal(typeof response.result, 'undefined');
  });

  test('phpWorkbench.executeCode should execute complex multiline PHP with mixed statements', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
$name = "PHP Workbench";
$version = "1.0";
echo "Extension: " . $name;
echo "Version: " . $version;
for ($i = 1; $i <= 3; $i++) {
    echo "Iteration: " . $i;
}`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(
      response.result!.stdout,
      'Extension: PHP WorkbenchVersion: 1.0Iteration: 1Iteration: 2Iteration: 3'
    );
    assert.equal(response.result!.returnValue, 'NULL');
  });

  test('phpWorkbench.executeCode should handle multiline PHP with syntax errors', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "line1";
echo "unclosed string
echo "line3";`,
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(
      response.error,
      `PHP Parse error: Syntax error, unexpected T_STRING, expecting ';' on line 3`
    );
    assert.equal(response.result, undefined);
  });

  test('phpWorkbench.executeCode should execute PHP with complex string content and special characters', async () => {
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

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.equal(
      response.result!.stdout,
      `String with 'single quotes' and "double quotes"String with "double quotes" and 'single quotes'Multiline string with\nactual line breaksDollar signs and $variable contains: interpolation`
    );
  });

  test('phpWorkbench.executeCode should handle execution when no active editor', async () => {
    // Close any open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.error, 'No active editor');
  });

  // Tests for selection-based code execution - following zero-one-many strategy
  test('phpWorkbench.executeCode should execute selected PHP code when text is selected', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20); // start of: echo "selected";
    const endPos = new vscode.Position(0, 36); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('selected'));
    assert.ok(!response.result!.stdout.includes('first'));
    assert.ok(!response.result!.stdout.includes('last'));
  });

  test('phpWorkbench.executeCode should execute multiline selected PHP code', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: `<?php
echo "before";
$name = "PHP Workbench";
echo "Selected: " . $name;
echo "after";`,
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(2, 0); // start of: $name = "PHP Workbench";
    const endPos = new vscode.Position(3, 26); // end of: echo "Selected: " . $name;
    editor.selection = new vscode.Selection(startPos, endPos);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('Selected: PHP Workbench'));
    assert.ok(!response.result!.stdout.includes('before'));
    assert.ok(!response.result!.stdout.includes('after'));
  });

  test('phpWorkbench.executeCode should execute entire document when no selection', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "second"; echo "third";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const cursorPos = new vscode.Position(0, 0);
    editor.selection = new vscode.Selection(cursorPos, cursorPos);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('first'));
    assert.ok(response.result!.stdout.includes('second'));
    assert.ok(response.result!.stdout.includes('third'));
  });

  test('phpWorkbench.executeCode should add PHP opening tag to selected code without it', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "before"; echo "selected"; echo "after";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    // Select only the middle echo statement without PHP opening tag
    const startPos = new vscode.Position(0, 21); // start of: echo "selected";
    const endPos = new vscode.Position(0, 37); // end of: echo "selected";
    editor.selection = new vscode.Selection(startPos, endPos);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.ok(response.result!.stdout.includes('selected'));
    assert.ok(!response.result!.stdout.includes('before'));
    assert.ok(!response.result!.stdout.includes('after'));
  });

  // Tests for focus restoration after output display
  test('phpWorkbench.executeCode should keep focus on editor after displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "test";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand<string>('phpWorkbench.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
  });

  test('phpWorkbench.executeCode should preserve cursor position when displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "line1"; echo "line2";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const originalPosition = new vscode.Position(0, 15);
    editor.selection = new vscode.Selection(originalPosition, originalPosition);

    await vscode.commands.executeCommand<string>('phpWorkbench.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
    assert.strictEqual(editor.selection.active.line, originalPosition.line);
    assert.strictEqual(editor.selection.active.character, originalPosition.character);
  });

  test('phpWorkbench.executeCode should preserve selection when displaying output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first"; echo "selected"; echo "last";',
      language: 'php',
    });
    const editor = await vscode.window.showTextDocument(document);

    const startPos = new vscode.Position(0, 20);
    const endPos = new vscode.Position(0, 36);
    const originalSelection = new vscode.Selection(startPos, endPos);
    editor.selection = originalSelection;

    await vscode.commands.executeCommand<string>('phpWorkbench.executeCode');

    assert.strictEqual(vscode.window.activeTextEditor, editor);
    assert.strictEqual(editor.selection.start.line, startPos.line);
    assert.strictEqual(editor.selection.start.character, startPos.character);
    assert.strictEqual(editor.selection.end.line, endPos.line);
    assert.strictEqual(editor.selection.end.character, endPos.character);
  });

  test('phpWorkbench.executeCode should show results in the webview', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '$a = 1;',
      language: 'php',
    });

    await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand<ExecuteCodeResponse>('phpWorkbench.executeCode');

    assert.ok(
      vscode.window.tabGroups.all.some(tabGroup =>
        tabGroup.tabs.some(tab => tab.label === 'PHP Workbench Results')
      )
    );
  });

  test('phpWorkbench.restartSession should restart session', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '$a = 1;',
      language: 'php',
    });

    const editor = await vscode.window.showTextDocument(document);

    let response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.result!.returnValue, '1');

    let wasEdited = await editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, '$a = 1;'.length + 1)),
        '++$a;'
      );
    });

    assert.ok(wasEdited);
    assert.equal(editor.document.getText(), '++$a;');

    response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.result!.returnValue, '2');

    await vscode.commands.executeCommand<ExecuteCodeResponse>('phpWorkbench.restartSession');

    wasEdited = await editor.edit(editBuilder => {
      editBuilder.replace(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, '++$a;'.length)),
        '$a;'
      );
    });

    assert.ok(wasEdited);
    assert.equal(editor.document.getText(), '$a;');

    response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.equal(response.error, 'Undefined variable $a');
    assert.equal(typeof response.result, 'undefined');
  });

  test('should reuse existing webview panel when available', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php echo "first";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    // Execute first time
    await vscode.commands.executeCommand('phpWorkbench.executeCode');

    const initialTabCount = vscode.window.tabGroups.all.reduce(
      (count, tabGroup) => count + tabGroup.tabs.length,
      0
    );

    // Execute second time
    await vscode.commands.executeCommand('phpWorkbench.executeCode');

    const finalTabCount = vscode.window.tabGroups.all.reduce(
      (count, tabGroup) => count + tabGroup.tabs.length,
      0
    );

    // Should not create additional webview tabs
    assert.equal(initialTabCount, finalTabCount);
  });

  test('should handle concurrent execution requests', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php usleep(10000); echo "concurrent";',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    // Execute multiple requests concurrently
    const promises = Array.from({ length: 5 }, () =>
      vscode.commands.executeCommand<ExecuteCodeResponse>('phpWorkbench.executeCode')
    );

    const responses = await Promise.all(promises);

    // All requests should complete without errors
    responses.forEach(response => {
      assert.equal(response.result?.stdout, 'concurrent');
    });
  });

  test('should handle extension activation and deactivation', async () => {
    const extension = vscode.extensions.getExtension('aaronjewell.php-workbench')!;

    // Extension should be active after running tests
    assert.ok(extension.isActive);

    // Test that commands are registered
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('phpWorkbench.newScratchpad'));
    assert.ok(commands.includes('phpWorkbench.executeCode'));
    assert.ok(commands.includes('phpWorkbench.restartSession'));
    assert.ok(commands.includes('phpWorkbench.reportIssue'));
  });

  test('should handle very large output', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '<?php for($i = 0; $i < 1000; $i++) { echo str_repeat("A", 100); }',
      language: 'php',
    });
    await vscode.window.showTextDocument(document);

    const response = await vscode.commands.executeCommand<ExecuteCodeResponse>(
      'phpWorkbench.executeCode'
    );

    assert.ok(response.result);
    assert.ok(typeof response.result.stdout === 'string');
  });
});
