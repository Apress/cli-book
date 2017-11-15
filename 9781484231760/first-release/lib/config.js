'use strict';

const cc = require('config-chain');
const lounger = require('./lounger.js');
const fs = require('fs');


exports.loadConfig = loadConfig;
function loadConfig (nopts) {
  return new Promise((resolve, reject) => {
    let cfg;

    if (!nopts.loungerconf) {
      cfg = cc(nopts)
        .on('load', () => {
          lounger.config = cfg;
          resolve(cfg);
        }).on('error', reject);
    } else {
      cfg = cc(nopts)
        .addFile(nopts.loungerconf, 'ini', 'config')
        .on('load', () => {
          lounger.config = cfg;
          resolve(cfg);
        }).on('error', reject);
    }
  });
};

exports.cli = cli;
function cli (cmd, key, value) {
  return new Promise((resolve, reject) => {

    function getUsageError () {
      const err = new Error([
        'Usage:',
        '',
        'lounger config get [<key>]',
        'lounger config set <key> <value>',
      ].join('\n'));
      err.type = 'EUSAGE';
      return err;
    }

    if (!cmd || (cmd !== 'get' && cmd !== 'set')) {
      const err = getUsageError();
      return reject(err);
    }

    if (cmd === 'get') {
      return get(key).then((result) => {
        console.log(result);
      }).catch(reject);
    }

    if (cmd === 'set') {
      if (!key && !value) {
        const err = getUsageError();
        return reject(err);
      }
      return set(key, value).catch(reject);
    }
  });
}

exports.api = {
  get: get,
  set: set
};

function set (key, value) {
  return new Promise((resolve, reject) => {
    if (!key && !value) {
      reject(new Error('key and value required'));
      return;
    }

    lounger.config.set(key, value, 'config');
    lounger.config.on('save', () => {
      resolve();
    });

    lounger.config.save('config');
  });
}

function get (key) {
  return new Promise((resolve, reject) => {
    const data = lounger.config.sources.config.data;
    if (lounger.config.get('json') && !key) {
      resolve(data);
      return;
    }
    if (lounger.config.get('json') && key) {
      resolve({[key]: data[key]});
      return;
    }

    if (key) {
      resolve(lounger.config.sources.config.data[key]);
      return;
    }

    const iniContent = fs.readFileSync(lounger.config.sources.config.path).toString();
    resolve(iniContent);
  });
}
