'use strict';

const assert = require('assert');
const fs = require('fs');

const config = require('../lib/config.js');

function writeFixture () {
  fs.writeFileSync(__dirname + '/fixtures/testconfig', 'hamburg=<3\n');
}

describe('config', () => {

  describe('api', () => {

    beforeEach(() => {
      writeFixture();
      return config.loadConfig({loungerconf: __dirname + '/fixtures/testconfig'});
    });

    it('reads the whole config file', () => {

      return config.api.get()
        .then(res => {
          assert.equal(res, 'hamburg=<3\n');
        });
    });

    it('reads config keys from files', () => {

      return config.api.get('hamburg')
        .then(res => {
          assert.equal(res, '<3');
        });
    });

    it('sets config', () => {

      return
        config.api.set('foo', 'bar')
        .then(() => {
          return config.api.get();
        })
        .then(res => {
          assert.equal(res, 'hamburg=<3\n');
        });
    });

    it('errors on not enough arguments given', () => {

      return
        config.api.set('foo', 'bar')
        .then(() => {
          return config.api.get();
        })
        .catch(err => {
          assert.ok(err instanceof Error);
        });
    });

  });

});
