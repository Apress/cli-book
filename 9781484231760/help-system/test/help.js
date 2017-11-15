'use strict';

const assert = require('assert');
const spawnSync = require('child_process').spawnSync;

describe('help', () => {

  describe('cli', () => {

    it('prints a general help message', () => {

      const out = spawnSync('node', [
      './bin/lounger-cli', 'help'
      ], {cwd: __dirname + '/..'});

      assert.ok(/Usage: lounger/.test(out.stdout));
      assert.ok(/help/.test(out.stdout));
      assert.ok(/isonline/.test(out.stdout));
    });
  });
});
