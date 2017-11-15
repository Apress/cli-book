'use strict';

const assert = require('assert');
const nock = require('nock');

describe('isonline', (done) => {

  it('detects if the database is online', (done) => {

    assert.equal('foo', 'to implement');
  });

  it('detects offline databases', (done) => {

    assert.equal('foo', 'to implement');
  });

  it('detects if something is online, but not a CouchDB/PouchDB', (done) => {

    assert.equal('foo', 'to implement');
  });

  it('just accepts valid urls', () => {

    assert.equal('foo', 'to implement');
  });

});
