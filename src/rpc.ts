import * as vscode from 'vscode';
import {
    createMessageConnection,
    StreamMessageReader,
    StreamMessageWriter,
    RequestType3,
    MessageConnection,
  } from 'vscode-jsonrpc/node';
import { Session } from "./session";
import assert from 'assert';

type EvalResponse = {
  stdout: string;
  returnValue: string;
  dirty: string;
  cleaned: string;
};

export type ExecuteCodeResponse = {
  result?: EvalResponse;
  error?: string;
};

const EvalRequest = new RequestType3<string, string, string, EvalResponse, void>('eval');

export class RpcServer {
    private errorEmitter = new vscode.EventEmitter<unknown>();
    onDidError: vscode.Event<unknown> = this.errorEmitter.event;
    private exitEmitter = new vscode.EventEmitter<number>();
    onDidExit: vscode.Event<number> = this.exitEmitter.event;

    private connection: MessageConnection | undefined;

    constructor(private readonly session: Session) {
    }

    eval(code: string, cwd: string): Promise<EvalResponse> {
        if (!this.connection) {
            return Promise.reject(new Error('Not connected'));
        }

        return this.connection.sendRequest(EvalRequest, code, cwd, this.session.token);
    }

    dispose(): void {
        this.connection?.dispose();
        this.session.dispose();
    }

    async listen(): Promise<void> {
        await this.session.isReady;

        assert(this.session.output(), 'Session output is not available');
        assert(this.session.input(), 'Session input is not available');

        this.connection = createMessageConnection(
            new StreamMessageReader(this.session.output()!),
            new StreamMessageWriter(this.session.input()!)
        );
        this.connection.listen();

        this.session.error()?.on('data', (data) => {
            vscode.window.showErrorMessage(`PHP Workbench: session error: ${data.toString()}`);
        });

        this.session.onDidError((err) => {
            vscode.window.showErrorMessage(`PHP Workbench: session error: ${err}`);
            this.errorEmitter.fire(err);
            this.dispose();
        });

        this.session.onDidExit((code) => {
            vscode.window.showInformationMessage(`PHP Workbench: session exited with code ${code}`);
            this.exitEmitter.fire(code);
            this.dispose();
        });

        this.connection.onError((err) => {
            vscode.window.showErrorMessage(`PHP Workbench: connection error: ${err}`);
            this.errorEmitter.fire(err);
            this.dispose();
        });

        this.connection.onClose(() => {
            vscode.window.showInformationMessage(`PHP Workbench: connection closed`);
            this.exitEmitter.fire(0);
            this.dispose();
        });
    }
}