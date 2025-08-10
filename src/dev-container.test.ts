import * as assert from 'assert';
import { detectDevContainerLike } from './dev-container';

suite('Dev Container detection', () => {
  test('detects dev-container', () => {
    const result = detectDevContainerLike({ remoteName: 'dev-container' });
    assert.equal(result.isContainerized, true);
    assert.equal(result.kind, 'dev-container');
  });

  test('detects codespaces', () => {
    const result = detectDevContainerLike({ remoteName: 'codespaces' });
    assert.equal(result.isContainerized, true);
    assert.equal(result.kind, 'codespaces');
  });

  test('is case-insensitive', () => {
    const result = detectDevContainerLike({ remoteName: 'DeV-CoNtAiNeR' });
    assert.equal(result.isContainerized, true);
    assert.equal(result.kind, 'dev-container');
  });

  test('non-container remotes are false', () => {
    for (const name of ['ssh-remote', 'wsl', ''] as const) {
      const result = detectDevContainerLike({ remoteName: name });
      assert.equal(result.isContainerized, false);
      assert.equal(result.kind, undefined);
    }
  });
});
