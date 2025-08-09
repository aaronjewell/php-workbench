import * as vscode from 'vscode';

/**
 * Centralized logging utility for the PHP Workbench extension.
 *
 * Why: Provide a single, reusable output channel and consistent logging API
 * across the extension. This replaces ad-hoc channel creation and scattered
 * logging, and enables debug filtering via user configuration.
 */
export class Logger {
  private static outputChannel: vscode.LogOutputChannel | undefined;

  /**
   * Lazily creates and returns the extension's output channel.
   * Ensures a single channel instance is used across the extension.
   */
  private static getChannel(): vscode.LogOutputChannel {
    if (!Logger.outputChannel) {
      Logger.outputChannel = vscode.window.createOutputChannel('PHP Workbench', { log: true });
    }
    return Logger.outputChannel;
  }

  /**
   * Writes an informational message to the output channel.
   */
  static info(message: string): void {
    Logger.getChannel().info(message);
  }

  /**
   * Writes a warning message to the output channel.
   */
  static warn(message: string): void {
    Logger.getChannel().warn(message);
  }

  /**
   * Writes an error message to the output channel.
   */
  static error(message: string): void {
    Logger.getChannel().error(message);
  }

  /**
   * Writes a debug message to the output channel when debug is enabled.
   * Debug is controlled by the `phpWorkbench.debug` configuration.
   */
  static debug(message: string): void {
    Logger.getChannel().debug(message);
  }

  /**
   * Appends a message line as-is without prefixes. Useful for piping
   * process output directly to the channel.
   */
  static appendRaw(line: string): void {
    Logger.getChannel().appendLine(line);
  }

  /**
   * Disposes the output channel. Intended for extension deactivation.
   */
  static dispose(): void {
    Logger.outputChannel?.dispose();
    Logger.outputChannel = undefined;
  }
}
