'use strict';

const fs = require('fs');

const pkg = require('../package.json');

const lounger = { loaded: false };
lounger.version = pkg.version;


const api = {}, cli = {};

Object.defineProperty(lounger, 'commands', {
  get: () => {
    if (lounger.loaded === false) {
      throw new Error('run lounger.load before');
    }
    return api;
  }
});

Object.defineProperty(lounger, 'cli', {
  get: () => {
    if (lounger.loaded === false) {
      throw new Error('run lounger.load before');
    }
    return cli;
  }
});

lounger.load = function load (opts) {
  return new Promise((resolve, reject) => {

    lounger.config = {
      get: (key) => {
        return opts[key];
      }
    };

    fs.readdir(__dirname, (err, files) => {
      files.forEach((file) => {
        if (!/\.js$/.test(file) || file === 'lounger.js') {
          return;
        }

        const cmd = file.match(/(.*)\.js$/)[1];
        const mod = require('./' + file);
        if (mod.cli) {
          cli[cmd] = mod.cli;
        }

        if (mod.api) {
          api[cmd] = mod.api;
        }

      });
      lounger.loaded = true;
      resolve(lounger);
    });
  });
};

module.exports = lounger;
