import * as assert from 'assert';
import {
  buildLocalPhpCommand,
  buildDockerRunCommand,
  buildComposeExecCommand,
} from './command-builder';

suite('Command builder', () => {
  test('local php', () => {
    const cmd = buildLocalPhpCommand({ entrypoint: '/ext/out/php-workbench.phar' });
    assert.equal(cmd.command, 'php');
    assert.deepEqual(cmd.args, ['/ext/out/php-workbench.phar']);
  });

  test('docker run with mounts, user, env, and php args', () => {
    const cmd = buildDockerRunCommand({
      image: 'php:8.3-cli',
      workdir: '/workspace',
      mounts: [
        { source: '/host/workspace', target: '/workspace' },
        { source: '/host/ext', target: '/ext', options: 'ro' },
      ],
      user: '1000:1000',
      env: { PHP_INI_SCAN_DIR: '/usr/local/etc/php/conf.d' },
      phpArgs: ['-dmemory_limit=256M'],
      containerEntrypoint: 'php',
      entrypointPathInContainer: '/ext/out/php-workbench.phar',
    });

    assert.equal(cmd.command, 'docker');
    assert.deepEqual(cmd.args, [
      'run',
      '-i',
      '--rm',
      '-u',
      '1000:1000',
      '-v',
      '/host/workspace:/workspace',
      '-v',
      '/host/ext:/ext:ro',
      '-w',
      '/workspace',
      '-e',
      'PHP_INI_SCAN_DIR=/usr/local/etc/php/conf.d',
      'php:8.3-cli',
      'php',
      '-dmemory_limit=256M',
      '/ext/out/php-workbench.phar',
    ]);
  });

  test('compose exec with user, workdir, env, and php args', () => {
    const cmd = buildComposeExecCommand({
      service: 'app',
      workdir: '/workspace',
      user: '1000:1000',
      env: { FOO: 'bar' },
      phpArgs: ['-dzend.assertions=1'],
      entrypointPathInService: '/ext/out/php-workbench.phar',
    });

    assert.equal(cmd.command, 'docker');
    assert.deepEqual(cmd.args, [
      'compose',
      'exec',
      '-T',
      '-u',
      '1000:1000',
      '-w',
      '/workspace',
      '-e',
      'FOO=bar',
      'app',
      'php',
      '-dzend.assertions=1',
      '/ext/out/php-workbench.phar',
    ]);
  });
});
