import { ChildProcess, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import Stream from 'node:stream';
import * as vscode from 'vscode';

class SessionTask extends vscode.Task {
  static readonly type = 'php-workbench.session';
  static readonly name = 'Session';
  static readonly source = 'PHP Workbench';
  constructor(cb: () => Promise<vscode.Pseudoterminal>) {
    super(
      { type: SessionTask.type },
      vscode.TaskScope.Workspace,
      SessionTask.name,
      SessionTask.source,
      new vscode.CustomExecution(cb)
    );

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

  private child?: ChildProcess;

  private stdin: Stream.Writable | null = null;
  private stdout: Stream.Readable | null = null;
  private stderr: Stream.Readable | null = null;

  public readonly isReady: Promise<boolean>;

  task: SessionTask | undefined;
  terminal: SessionTerminal | undefined;

  readonly token: string;

  constructor(private readonly opts: SpawnOptions) {
    this.terminal = new SessionTerminal();
    this.task = new SessionTask(() => Promise.resolve(this.terminal!));

    this.token = this.generateToken();

    this.isReady = new Promise((resolve, _reject) => {
      this.terminal?.onDidOpen(() => {
        this.spawnChild();
        resolve(true);
      });

      this.terminal?.onDidClose?.(() => {
        this.dispose();
      });
    });
  }

  dispose(): void {
    if (this.child && !this.child.killed) {
      this.child.kill();
    }
    this.child?.removeAllListeners();
    this.child = undefined;

    this.stdin?.end();

    if (this.terminal) {
      this.terminal = undefined;
    }

    if (this.task) {
      this.task = undefined;
    }
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
    this.child = spawn(
      this.opts.command,
      this.opts.args ?? [],
      {
        cwd: this.opts.cwd,
        env: { ...this.opts.env, PHP_WORKBENCH_TOKEN: this.token },
        stdio: ["pipe", "pipe", "pipe"]
      }
    );

    this.child.once("error", (err) => {
      this.errorEmitter.fire(err);
      this.dispose();
    });

    this.child.once("disconnect", () => {
      this.exitEmitter.fire(0);
      this.dispose();
    });

    this.child.once("exit", (code, sig) => {
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