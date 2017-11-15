'use strict';

const request = require('request');


function isOnline (url) {
  return new Promise((resolve, reject) => {
    request({
      uri: url,
      json: true
    }, (err, res, body) => {

      // db is down
      if (err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
        return resolve({[url]: false});
      }

      // any other error
      if (err) {
        return reject(err);
      }

      // we got a welcome from CouchDB / PouchDB
      const isDatabase = (body.couchdb === 'Welcome' ||
        body['express-pouchdb'] === 'Welcome!');

      return resolve({[url]: isDatabase});
    });
  });
}
exports.api = isOnline;

function cli (url) {
  return new Promise((resolve, reject) => {

    if (!url) {
      const err = new Error('Usage: lounger isonline <url>');
      err.type = 'EUSAGE';
      return reject(err);
    }

    if (!/^(http:|https:)/.test(url)) {
      const err = new Error([
        'invalid protocol, must be https or http',
        'Usage: lounger isonline <url>'
      ].join('\n'));
      err.type = 'EUSAGE';
      return reject(err);
    }

    isOnline(url).then((results) => {

      // print on stdout for terminal users
      Object.keys(results).forEach((entry) => {
        let msg = 'seems to be offline or no database server';
        if (results[entry]) {
          msg = 'seems to be online';
        }

        console.log(entry, msg);
        resolve(results);
      });
    }).catch(reject);
  });
}
exports.cli = cli;
