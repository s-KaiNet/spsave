module.exports = function (gulp, $) {
  'use strict';

  var remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');

  gulp.task('test', function (callback) {
    $.rns('tsc', 'postcoverage', callback);
  });

  gulp.task('postcoverage', ['testonly'], function () {
    return gulp.src('./reports/coverage/html/coverage-final.json')
      .pipe(remapIstanbul({
        reports: {
          'html': 'reports/coverage/html-remap',
          'lcovonly': 'reports/coverage/lcov.info'
        }
      }));
  });

  gulp.task('test-ci', ['test'], function () {
    return gulp.src('./lib/test/unit/tests.js', { read: false })
      .pipe($.mocha({
        reporter: 'mocha-junit-reporter',
        reporterOptions: {
          mochaFile: './reports/test/testrun.xml'
        }
      }))
  });

  gulp.task('testonly', ['pre-test'], function () {
    return gulp.src('./lib/test/unit/tests.js', { read: false })
      .pipe($.plumber())
      .pipe($.mocha({ reporter: 'spec' }))
      .pipe($.istanbul.writeReports({
        dir: './coverage/html',
        reporters: ['json', 'html', 'lcovonly'],
        reportOpts: { dir: './reports/coverage/html' }
      }));
  });

  gulp.task('pre-test', function () {
    return gulp.src(['./lib/src/**/*.js', '!./lib/src/index.js'])
      .pipe($.istanbul({
        includeUntested: true
      }))
      .pipe($.istanbul.hookRequire());
  });

  gulp.task('test-int', function(callback) {
    $.rns('tsc', 'test-integration', callback);
  });

  gulp.task('test-integration', function () {
    return gulp.src('./lib/test/integration/tests.js', { read: false })
      .pipe($.plumber())
      .pipe($.mocha({ reporter: 'spec' }));
  });
};
