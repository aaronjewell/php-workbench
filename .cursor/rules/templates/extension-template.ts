import * as vscode from 'vscode';

/**
 * Extension activation function
 * Called when extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
    // Register commands
    const createScratchpadCommand = vscode.commands.registerCommand(
        'quickmix.createScratchpad',
        createScratchpadHandler
    );
    
    const executeCodeCommand = vscode.commands.registerCommand(
        'quickmix.executeCode',
        executeCodeHandler
    );

    // Add disposables to context
    context.subscriptions.push(createScratchpadCommand, executeCodeCommand);
    
    // Initialize services if needed
    // const outputChannel = vscode.window.createOutputChannel('QuickMix');
    // context.subscriptions.push(outputChannel);
}

/**
 * Command handler example with proper error handling
 */
async function createScratchpadHandler(): Promise<void> {
    try {
        // Implementation logic here
        // Separate business logic into testable services
        
        vscode.window.showInformationMessage('Scratchpad created successfully');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create scratchpad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function executeCodeHandler(): Promise<void> {
    try {
        // Implementation logic here
        // Use services for business logic, keep VSCode API calls minimal
        
    } catch (error) {
        vscode.window.showErrorMessage(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Extension deactivation function
 * Called when extension is deactivated
 */
export function deactivate() {
    // Cleanup resources if needed
} 