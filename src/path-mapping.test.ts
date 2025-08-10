import * as assert from 'assert';
import { mapHostToContainer, mapContainerToHost } from './path-mapping';

suite('Path mapping', () => {
  test('darwin: maps host path under root to container mount and back', () => {
    const hostRoot = '/Users/alice/project';
    const containerRoot = '/workspace';
    const hostPath = '/Users/alice/project/src/Foo.php';
    const expectedContainer = '/workspace/src/Foo.php';

    const c = mapHostToContainer(hostPath, { hostRoot, containerRoot, platform: 'darwin' });
    assert.equal(c, expectedContainer);

    const h = mapContainerToHost(c, { hostRoot, containerRoot, platform: 'darwin' });
    assert.equal(h, hostPath);
  });

  test('linux: leaves path unchanged when outside hostRoot', () => {
    const c = mapHostToContainer('/opt/other/file.php', {
      hostRoot: '/home/bob/project',
      containerRoot: '/workspace',
      platform: 'linux',
    });
    assert.equal(c, '/opt/other/file.php');
  });

  test('win32: maps Windows host path to container mount and back', () => {
    const hostRoot = 'C:\\Users\\Alice\\project';
    const containerRoot = '/workspace';
    const hostPath = 'C:\\Users\\Alice\\project\\lib\\Util.php';
    const expectedContainer = '/workspace/lib/Util.php';

    const c = mapHostToContainer(hostPath, { hostRoot, containerRoot, platform: 'win32' });
    assert.equal(c, expectedContainer);

    const h = mapContainerToHost(c, { hostRoot, containerRoot, platform: 'win32' });
    assert.equal(h, hostPath);
  });

  test('basename is preserved through mapping', () => {
    const hostRoot = '/Users/alice/project';
    const containerRoot = '/workspace';
    const hostPath = '/Users/alice/project/a/b/c/d.txt';

    const c = mapHostToContainer(hostPath, { hostRoot, containerRoot, platform: 'darwin' });
    const h = mapContainerToHost(c, { hostRoot, containerRoot, platform: 'darwin' });

    assert.ok(c.endsWith('/d.txt'));
    assert.ok(h.endsWith('/d.txt'));
  });
});
