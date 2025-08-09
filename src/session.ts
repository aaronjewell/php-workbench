import { ChildProcess, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import Stream from 'node:stream';
import * as vscode from 'vscode';
import { Logger } from './logger';

class SessionTask extends vscode.Task {
  static readonly type = 'php-workbench.session';
  static readonly name = 'PHP Workbench: Session';
  static readonly source = 'PHP Workbench';

  public readonly terminal: SessionTerminal;

  constructor() {
    const terminal = new SessionTerminal();
    const execution = new vscode.CustomExecution(() => Promise.resolve(terminal));

    super(
      { type: SessionTask.type },
      vscode.TaskScope.Workspace,
      SessionTask.name,
      SessionTask.source,
      execution
    );

    this.terminal = terminal;
    this.presentationOptions.focus = false;
    this.presentationOptions.echo = false;
    this.presentationOptions.reveal = vscode.TaskRevealKind.Silent;
    this.presentationOptions.panel = vscode.TaskPanelKind.Dedicated;
    this.presentationOptions.showReuseMessage = false;
    this.isBackground = true;
  }
}

class SessionTerminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  private closeEmitter = new vscode.EventEmitter<number>();
  onDidClose?: vscode.Event<number> = this.closeEmitter.event;
  private openEmitter = new vscode.EventEmitter<void>();
  onDidOpen: vscode.Event<void> = this.openEmitter.event;

  open(_initialDimensions: vscode.TerminalDimensions | undefined): void {
    this.openEmitter.fire();
  }

  write(data: string): void {
    this.writeEmitter.fire(data);
  }

  close(): void {
    this.closeEmitter.fire(0);
  }
}

export interface SpawnOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export class Session {
  private errorEmitter = new vscode.EventEmitter<unknown>();
  onDidError: vscode.Event<unknown> = this.errorEmitter.event;
  private exitEmitter = new vscode.EventEmitter<number>();
  onDidExit: vscode.Event<number> = this.exitEmitter.event;

  private child: ChildProcess | undefined;

  private stdin: Stream.Writable | null = null;
  private stdout: Stream.Readable | null = null;
  private stderr: Stream.Readable | null = null;

  public readonly isReady: Promise<boolean>;

  task: SessionTask | undefined;

  readonly token: string;

  private _terminalCloseListener: vscode.Disposable | undefined;
  private _terminalOpenListener: vscode.Disposable | undefined;
  private _disposed = false;

  constructor(private readonly opts: SpawnOptions) {
    this.task = new SessionTask();

    this.token = this.generateToken();

    this.isReady = new Promise((resolve, reject) => {
      if (!this.task) {
        reject(new Error('Task not initialized'));
        return;
      }

      Logger.info(`Session created, waiting for terminal to open`);

      this._terminalOpenListener = this.task.terminal.onDidOpen(() => {
        Logger.info(`Terminal opened, spawning child process`);
        this._terminalOpenListener?.dispose();
        this._terminalOpenListener = undefined;
        this.spawnChild();
        resolve(true);
      });

      this._terminalCloseListener = this.task.terminal.onDidClose?.(() => {
        Logger.info(`Terminal closed`);
        this._terminalCloseListener?.dispose();
        this._terminalCloseListener = undefined;
        this.dispose();
      });
    });
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }

    Logger.info(`Disposing session`);
    this._disposed = true;

    if (this.child && !this.child.killed) {
      Logger.info(`Killing child process`);
      this.child.kill();
    }
    Logger.info(`Removing child process listeners`);
    this.child?.removeAllListeners();
    this.child = undefined;

    Logger.info(`Ending process streams`);
    this.stdin?.end();
    this.stdout = null;
    this.stderr = null;
    this.stdin = null;

    Logger.info(`Closing terminal`);
    this.task?.terminal.close();

    Logger.info(`Removing task`);
    this.task = undefined;
  }

  output(): Stream.Readable | null {
    return this.stdout;
  }

  error(): Stream.Readable | null {
    return this.stderr;
  }

  input(): Stream.Writable | null {
    return this.stdin;
  }

  private spawnChild(): void {
    this.child = spawn(this.opts.command, this.opts.args ?? [], {
      cwd: this.opts.cwd,
      env: { ...this.opts.env, PHP_WORKBENCH_TOKEN: this.token },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.child.once('error', err => {
      this.errorEmitter.fire(err);
      this.dispose();
    });

    this.child.once('disconnect', () => {
      this.exitEmitter.fire(0);
      this.dispose();
    });

    this.child.once('exit', (code, sig) => {
      this.exitEmitter.fire(code ?? 0);
      this.dispose();
    });

    this.stdout = this.child.stdout;
    this.stderr = this.child.stderr;
    this.stdin = this.child.stdin;
  }

  /**
   * Generates a secure random token for PHP process authentication
   *
   * @returns A cryptographically secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
