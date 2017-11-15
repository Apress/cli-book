const parse = require('csv-parse');
const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');
const Writable = require('stream').Writable;
const request = require('request');
const lounger = require('./lounger.js');

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

function createTargetDatabase (url) {
  return new Promise((resolve, reject) => {
    request({
      json: true,
      uri: url,
      method: 'PUT',
      body: {}
    }, function (er, res, body) {

      if (er && (er.code === 'ECONNREFUSED' || er.code === 'ENOTFOUND')) {
        const err = new Error(
          'Could not connect to ' + url + '. Please check if the database is offline'
        );
        err.type = 'EUSAGE';
        return reject(err);
      }

      if (er) {
        return reject(er);
      }

      const code = res.statusCode;

      if (code !== 200 && code !== 201 && code !== 412) {
        const msg = 'CouchDB server answered: \n Status: ' +
          res.statusCode + '\n Body: ' + JSON.stringify(body);
        return reject(new Error(msg));
      }
      resolve();
    });
  });
}

exports.api = {
  transfer: bulkdocsImport
};

function bulkdocsImport (file, targetDb) {
  return new Promise((resolve, reject) => {
    const opts = {};

    if (!file && !targetDb) {
      return reject(new Error('file and/or targetDb argument missing'));
    }

    opts.delimiter = lounger.config.get('delimiter') || ';';
    opts.comment = lounger.config.get('comment') || '#';
    opts.chunksize = lounger.config.get('chunksize') || 200;

    createTargetDatabase(targetDb)
      .then(() => {
        return importFromCsvFile(file, targetDb, opts);
      }).catch(reject);
  });
}

function importFromCsvFile (file, url, opts) {
  return new Promise((resolve, reject) => {
    const options = {comment: opts.comment, delimiter: opts.delimiter, columns: true};
    const parser = parse(options);
    const input = fs.createReadStream(file);

    input
      .pipe(parser)
      .on('error', reject)
      .pipe(new TransformToBulkDocs({bufferedDocCount: opts.chunksize}))
      .on('error', reject)
      .pipe(new CouchBulkImporter({url: url}))
      .on('error', reject);
  });
}

exports.cli = importCli;
function importCli (cmd, file, target) {
  return new Promise((resolve, reject) => {
    if (!cmd || cmd !== 'transfer' || !file || !target) {
      const err = new Error(
        'Usage: lounger csv transfer <file> <database> [--delimiter=;] [--comment=#] [--chunksize=200]'
      );
      err.type = 'EUSAGE';
      return reject(err);
    }

    return bulkdocsImport(file, target).catch(reject);
  });
}
