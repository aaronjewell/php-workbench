import path from 'node:path';

export type Platform = 'darwin' | 'linux' | 'win32';

export type MappingOptions = {
  hostRoot: string;
  containerRoot: string;
  platform: Platform;
};

function normalizeWin(p: string): string {
  return p.replace(/\\/g, '/');
}

function ensureNoTrailingSlash(p: string): string {
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function mapHostToContainer(hostPath: string, opts: MappingOptions): string {
  const { hostRoot, containerRoot, platform } = opts;
  const normalizedRoot = platform === 'win32' ? normalizeWin(hostRoot) : hostRoot;
  const normalizedHost = platform === 'win32' ? normalizeWin(hostPath) : hostPath;

  const rootNoSlash = ensureNoTrailingSlash(normalizedRoot);
  const containerNoSlash = ensureNoTrailingSlash(containerRoot);

  if (!normalizedHost.startsWith(rootNoSlash + '/')) {
    return hostPath;
  }

  const rel = normalizedHost.slice(rootNoSlash.length);
  return containerNoSlash + rel;
}

export function mapContainerToHost(containerPath: string, opts: MappingOptions): string {
  const { hostRoot, containerRoot, platform } = opts;
  const containerNoSlash = ensureNoTrailingSlash(containerRoot);
  const normalizedContainer = containerPath.replace(/\\/g, '/');

  if (!normalizedContainer.startsWith(containerNoSlash + '/')) {
    return containerPath;
  }

  const rel = normalizedContainer.slice(containerNoSlash.length);
  if (opts.platform === 'win32') {
    return (ensureNoTrailingSlash(hostRoot) + rel).replace(/\//g, '\\');
  }
  return ensureNoTrailingSlash(hostRoot) + rel;
}
