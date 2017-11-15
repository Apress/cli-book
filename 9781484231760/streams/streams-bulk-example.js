const parse = require('csv-parse');
const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');
const Writable = require('stream').Writable;
const request = require('request');

function TransformToBulkDocs (options) {
  if (!options) {
    options = {};
  }

  if (!options.bufferedDocCount) {
    options.bufferedDocCount = 200;
  }

  Transform.call(this, {
    objectMode: true
  });

  this.buffer = [];
  this.bufferedDocCount = options.bufferedDocCount;
}

util.inherits(TransformToBulkDocs, Transform);

TransformToBulkDocs.prototype._transform = transform;
function transform (chunk, encoding, done) {

  this.buffer.push(chunk);
  if (this.buffer.length >= this.bufferedDocCount) {
    this.push({docs: this.buffer});
    this.buffer = [];
  }

  done();
}

TransformToBulkDocs.prototype._flush = flush;
function flush (done) {

  this.buffer.length && this.push({docs: this.buffer});
  done();
}


function CouchBulkImporter (options) {
  if (!options) {
    options = {};
  }

  if (!options.url) {
    const msg = [
      'options.url must be set',
      'example:',
      "new CouchBulkImporter({url: 'http://localhost:5984/baseball'})"
    ].join('\n')
    throw new Error(msg);
  }

  Writable.call(this, {
    objectMode: true
  })

  // sanitise url, remove trailing slash
  this.url = options.url.replace(/\/$/, '');
}
util.inherits(CouchBulkImporter, Writable);


CouchBulkImporter.prototype._write = write;
function write (chunk, enc, done) {
  request({
    json: true,
    uri: this.url + '/_bulk_docs',
    method: 'POST',
    body: chunk
  }, function (err, res, body) {
    if (err) {
      return done(err);
    }

    if (!/^2../.test(res.statusCode)) {
      const msg = 'CouchDB server answered: \n Status: ' +
        res.statusCode + '\n Body: ' + JSON.stringify(body);
      return done(new Error(msg));
    }

    done();
  });
}


const opts = {comment: '#', delimiter: ';', columns: true};
const parser = parse(opts);
const input = fs.createReadStream(__dirname + '/test/fixtures/test.csv');

input
  .pipe(parser)
  .pipe(new TransformToBulkDocs())
  .pipe(new CouchBulkImporter({url: 'http://127.0.0.1:5984/travel'}));
