/**
 * Build-only command constructors for different backends.
 *
 * Keep process orchestration testable and stable by generating argv arrays
 * without spawning. Integration points can consume these results.
 */

export type LocalPhpOptions = {
  entrypoint: string;
};

export type DockerMount = {
  source: string;
  target: string;
  options?: string; // e.g., 'ro', 'z'
};

export type DockerRunOptions = {
  image: string;
  workdir: string;
  mounts: DockerMount[];
  user?: string; // UID:GID
  env?: Record<string, string>;
  phpArgs?: string[]; // additional args before entrypoint
  containerEntrypoint?: string; // defaults to 'php'
  entrypointPathInContainer: string;
};

export type ComposeExecOptions = {
  service: string;
  workdir?: string;
  user?: string;
  env?: Record<string, string>;
  phpArgs?: string[];
  entrypointPathInService: string;
};

export function buildLocalPhpCommand(opts: LocalPhpOptions): { command: string; args: string[] } {
  return { command: 'php', args: [opts.entrypoint] };
}

export function buildDockerRunCommand(opts: DockerRunOptions): { command: string; args: string[] } {
  const args: string[] = ['run', '-i', '--rm'];

  if (opts.user) {
    args.push('-u', opts.user);
  }

  for (const m of opts.mounts) {
    const spec = `${m.source}:${m.target}${m.options ? ':' + m.options : ''}`;
    args.push('-v', spec);
  }

  args.push('-w', opts.workdir);

  if (opts.env) {
    for (const [k, v] of Object.entries(opts.env)) {
      args.push('-e', `${k}=${v}`);
    }
  }

  args.push(opts.image);

  const entry = opts.containerEntrypoint ?? 'php';
  args.push(entry);

  if (opts.phpArgs?.length) {
    args.push(...opts.phpArgs);
  }

  args.push(opts.entrypointPathInContainer);

  return { command: 'docker', args };
}

export function buildComposeExecCommand(opts: ComposeExecOptions): {
  command: string;
  args: string[];
} {
  const args: string[] = ['compose', 'exec', '-T'];
  if (opts.user) {
    args.push('-u', opts.user);
  }
  if (opts.workdir) {
    args.push('-w', opts.workdir);
  }
  if (opts.env) {
    for (const [k, v] of Object.entries(opts.env)) {
      args.push('-e', `${k}=${v}`);
    }
  }
  args.push(opts.service);
  args.push('php');
  if (opts.phpArgs?.length) {
    args.push(...opts.phpArgs);
  }
  args.push(opts.entrypointPathInService);
  return { command: 'docker', args };
}
