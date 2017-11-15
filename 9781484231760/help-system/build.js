'use strict';

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const glob = require('glob');
const path = require('path');

const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

function cleanUpMan () {
  rimraf.sync(__dirname + '/man/');
  // recreate the target directory
  mkdirp.sync(__dirname + '/man/');
}

const sources = {
  api: getSources('api'),
  cli: getSources('cli'),
  websiteIndex: getSources('website'),
};

function getSources (type) {
  const files = glob.sync('doc/' + type + '/*.md');

  return files.map(file => path.resolve(file));
}

function buildMan () {
  cleanUpMan();

  Object.keys(sources).forEach(type => {

    sources[type].forEach(currentFile => {

      if (type === 'websiteIndex') {
        return;
      }

      // convert markdown to manpages
      const out = spawnSync('node', [
        './node_modules/marked-man/bin/marked-man',
        currentFile
      ]);

      const target = getTargetForManpages(currentFile, type);

      // write output to target file
      fs.writeFileSync(target, out.stdout, 'utf8');
    })
  });
}

function getTargetForManpages (currentFile, type) {
  let target;
  // set the right section for the man page on unix systems
  // if (/\/doc\/cli\//.test(currentFile)) {
  if (type === 'cli') {
    target = currentFile.replace(/\.md$/, '.1');
  }

  if (type === 'api') {
    target = currentFile.replace(/\.md$/, '.3');
  }

  if (!target) {
    return;
  }

  // replace the source dir with the target dir
  // do it for the windows path (doc\\api) and the unix path (doc/api)
  target = target
    .replace(['doc', 'cli'].join(path.sep), 'man')
    .replace(['doc', 'api'].join(path.sep), 'man');

  return target;
}

function cleanUpWebsite () {
  rimraf.sync(__dirname + '/website/');
  mkdirp.sync(__dirname + '/website/');
}

function getTargetForWebsite (currentFile, type) {
  let target = currentFile;
  // modifiy the filename a bit for our html file:
  // prefix all cli functions with cli- instead of lounger-
  // prefix all api functions with api- instead of lounger-
  if (type === 'cli') {
    target = currentFile.replace(/lounger-/, 'cli-');
  }

  if (type === 'api') {
    target = currentFile.replace(/lounger-/, 'api-');
  }

  // set the file ending to html
  target = target.replace(/\.md$/, '.html');

  // replace the source dir with the target dir
  target = target
    .replace(['doc', 'cli'].join(path.sep), 'website')
    .replace(['doc', 'api'].join(path.sep), 'website')
    .replace(['doc', 'website'].join(path.sep), 'website');

  return target;
}

function getTocForWebsite () {
  let toc = '<ul>';

  Object.keys(sources).forEach(type => {

    if (type === 'websiteIndex') {
      return;
    }

    toc += `<li><span>${type}</span><ul>`;

    sources[type].forEach(currentFile => {
      const prefix = type === 'cli' ? 'cli-' : 'api-';

      const file = path.basename(currentFile)
        .replace('lounger-', prefix)
        .replace(/\.md/, '.html');

      const linktext = path.basename(currentFile)
        .replace('lounger-', '')
        .replace(/\.md/, '');

      toc += `<li><a href="${file}">${linktext}</a></li>`;
    });
    toc += '</ul></li>';
  });

  toc += '</ul>';

  return toc;
}

const templateFile = __dirname + '/doc/website/template.html';

function buildWebsite () {
  cleanUpWebsite();

  const template = fs.readFileSync(templateFile, 'utf8');
  const toc = getTocForWebsite();

  Object.keys(sources).forEach(type => {

    sources[type].forEach(currentFile => {

        // convert markdown to website content
      const out = spawnSync('node', [
        './node_modules/marked/bin/marked',
        currentFile
      ]);

      const target = getTargetForWebsite(currentFile, type);

      const rendered = template
        .replace('__CONTENT__', out.stdout)
        .replace('__TOC__', toc);

      // write output to target file
      fs.writeFileSync(target, rendered, 'utf8');
    });
  });
}

buildMan();
buildWebsite();
