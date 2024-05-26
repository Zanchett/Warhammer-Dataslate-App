const { src, dest, series } = require('gulp');
const rename = require('gulp-rename');
const del = require('del');

const { config } = require('../package.json');

function makeTask(opts) {
  const { key, pipe = [] } = opts;

  function runTask() {
    
    src(
      opts.src.map((file) => config.srcDir + file),
      {
        sourcemaps: config.sourcemaps
      }
    ).pipe(dest(config.distDir)); 

    const filesToModify = src(
      opts.src.map((file) => config.distDir + file),
      {
        sourcemaps: config.sourcemaps
      }
    ); 

    const pipes = pipe.map((processor) => {
      const fn = require(processor.require);
      return fn.apply(null, processor.args);
    });

    if (opts.rename) {
      pipes.push(makeRename(opts.rename));
    }

    
    return (
      pipes
        .reduce((stream, processor) => {
          return stream.pipe(processor);
        }, filesToModify)

       
        .pipe(
          dest(config.distDir, {
            sourcemaps: '.'
          })
        )
    );
  }

  runTask.displayName = key;

  if (opts.cleanup) {
    return series(runTask, makeCleanup(opts));
  }

  return runTask;
}


function makeRename(opts) {
  
  if (opts.find) {
    return rename(function (path) {
      path.basename = path.basename.replace(opts.find, opts.replace);
    });
  }

  return rename(opts);
}


function makeCleanup(opts) {
  function runCleanup(done) {
    const filesToDelete = Array.isArray(opts.cleanup) ? opts.cleanup : opts.src;
    del.sync(filesToDelete.map((file) => config.distDir + file));
    done();
  }
  runCleanup.displayName = 'cleanup:' + opts.key;
  return runCleanup;
}

module.exports = {
  makeTask
};