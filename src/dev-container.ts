/**
 * Detect whether the extension is running in a containerized remote (Dev Containers or Codespaces).
 */
export type ContainerizedRemote = 'dev-container' | 'codespaces';

export type DevContainerDetectionInput = {
  /** VS Code remote name, e.g. 'dev-container', 'codespaces', 'ssh-remote', 'wsl' */
  remoteName?: string;
};

export type DevContainerDetection = {
  isContainerized: boolean;
  kind?: ContainerizedRemote;
};

const containerizedRemotes: readonly ContainerizedRemote[] = [
  'dev-container',
  'codespaces',
] as const;

export function detectDevContainerLike(input: DevContainerDetectionInput): DevContainerDetection {
  const name = (input.remoteName || '').toLowerCase();
  if (containerizedRemotes.includes(name as ContainerizedRemote)) {
    return { isContainerized: true, kind: name as ContainerizedRemote };
  }
  return { isContainerized: false };
}
