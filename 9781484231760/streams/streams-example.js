const parse = require('csv-parse');
const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');

function MyTransformStream () {

  Transform.call(this, {
    objectMode: true
  });
}

util.inherits(MyTransformStream, Transform);

MyTransformStream.prototype._transform = transform;
function transform (chunk, encoding, done) {

  console.log('chunk: ', chunk);

  this.push(chunk);

  done();
}

const opts = {comment: '#', delimiter: ';', columns: true};
const parser = parse(opts);
const input = fs.createReadStream(__dirname + '/test/fixtures/test.csv');

input
  .pipe(parser)
  .pipe(new MyTransformStream());
