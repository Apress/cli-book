'use strict';

const assert = require('assert');
const nock = require('nock');

const isonline = require('../lib/isonline.js').api;
describe('isUrlOnline', () => {

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
