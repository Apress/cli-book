'use strict';

const assert = require('assert');
const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const nock = require('nock');

const http = require('http');
const hock = require('hock');

const isonline = require('../lib/isonline.js').api;
describe('isOnline', () => {

  describe('cli', (done) => {

    it('prints usage errors on stderr', () => {

      const out = spawnSync('node', [
        './bin/lounger-cli', 'isonline'
      ], {cwd: __dirname + '/..'});

      assert.equal(
        'ERR! Usage: lounger isonline <url> \n',
        out.stderr
      );
    });

    it('detects if a database is online', (done) => {

      const mock = hock.createHock();
      mock
        .get('/')
        .reply(200, JSON.stringify({"express-pouchdb":"Welcome!"}));

      const server = http.createServer(mock.handler);
      server.listen(1337, () => {
        test();
      });

      function test () {
        let buffer = '';

        const child = spawn('node', [
          './bin/lounger-cli', 'isonline', 'http://127.0.0.1:1337'
        ], {cwd: __dirname + '/..'});

        child.stdout.on('data', (b) => {
          buffer += b.toString();
        });

        child.on('close', () => {
          assert.equal(
            'http://127.0.0.1:1337 seems to be online\n',
            buffer
          );
          server.close();
          done();
        });
      }
    });

    it('detects if a database is offline', (done) => {

      const mock = hock.createHock();
      mock
        .get('/')
        .reply(200, 'meh');

      const server = http.createServer(mock.handler);
      server.listen(1337, () => {
        test();
      });

      function test () {
        let buffer = '';

        const child = spawn('node', [
          './bin/lounger-cli', 'isonline', 'http://127.0.0.1:1337'
        ], {cwd: __dirname + '/..'});

        child.stdout.on('data', (b) => {
          buffer += b.toString();
        });

        child.on('close', () => {
          assert.equal(
            'http://127.0.0.1:1337 seems to be offline or no database server\n',
            buffer
          );
          server.close();
          done();
        });
      }
    });
  });

  describe('api', () => {
    it('detects if the database is online', () => {
      nock('http://127.0.0.11')
        .get('/')
        .reply(200, JSON.stringify({"express-pouchdb":"Welcome!"}));

      return isonline('http://127.0.0.11')
        .then(res => {
          assert.deepEqual(res, {'http://127.0.0.11': true});
        });
    });

    it('detects offline databases', () => {
      return isonline('http://doesnotexist.example.com')
        .then(res => {
          assert.deepEqual(res, {'http://doesnotexist.example.com': false});
        });
    });

    it('detects if something is online, but not a CouchDB/PouchDB', () => {
      nock('http://127.0.0.11')
        .get('/')
        .reply(200, 'hellooo');

      return isonline('http://127.0.0.11')
        .then(res => {
          assert.deepEqual(res, {'http://127.0.0.11': false});
        });
    });

    it('rejects the promise on invalid urls', () => {
      return isonline('http://127.0.0.11')
        .catch(err => {
          assert.ok(err instanceof Error);
        });
    });
  });
});
