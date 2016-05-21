module.exports = function (gulp, $) {
  'use strict';

var emitError = !!$.yargs.argv.emitError;

  gulp.task('tslint', function () {
    return gulp.src(['src/**/*.ts', 'test/**/*.ts'])
      .pipe($.tslint({
        configuration: './tslint.json'
      }))
      .pipe($.tslint.report('verbose', {
        summarizeFailureOutput: true,
        emitError: emitError
      }));
  });
};