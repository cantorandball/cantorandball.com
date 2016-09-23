'use strict';

// Packages

var assemble     = require('assemble'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync  = require('browser-sync'),
    del          = require('del'),
    extname      = require('gulp-extname'),
    ghPages      = require('gulp-gh-pages'),
    gulp         = require('gulp'),
    imagemin     = require('gulp-imagemin'),
    RevAll       = require('gulp-rev-all'),
    runSequence  = require('run-sequence'),
    shell        = require('gulp-shell'),
    size         = require('gulp-size');

var app    = assemble(),
    reload = browserSync.reload;

// Configuration

var paths = {
  files: ['./app/CNAME'],
  html:  ['./app/views'],
  img:   ['./app/assets/img/**/*'],
  css:   [
    './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './app/assets/css/**/*.css'
  ]
};


// Tasks

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: './dist'
    }
  });
});

gulp.task('clean', function() {
  return del(['./dist']);
});

gulp.task('compile', ['clean'], function() {
  runSequence(['files', 'html', 'images', 'stylesheets']);
});

gulp.task('images', function() {
  return gulp.src(paths.img)
    .pipe(imagemin({
      multipass: true,
      svgoPlugins: [{collapseGroups: false, removeViewBox: false}]
    }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('load', function(cb) {
  app.partials(paths.html + '/partials/*.hbs');
  app.pages(paths.html  + '/*.hbs');
  cb();
});

gulp.task('stylesheets', function() {
  return gulp.src(paths.css)
    .pipe(autoprefixer())
    .pipe(gulp.dest('./dist/css'))
    .pipe(reload({stream: true}));
});

gulp.task('files', function() {
  return gulp.src(paths.files)
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
  gulp.watch(paths.html + '/**/*.hbs', ['html']);
  gulp.watch(paths.img,  ['images']);
  gulp.watch(paths.css,  ['stylesheets']);

  gulp.watch('./dist/*.html').on('change', reload);
});

gulp.task('html', ['load'], function () {
  return app.toStream('pages')
    .pipe(app.renderFile())
    .pipe(extname())
    .pipe(app.dest('dist'));
});

gulp.task('rev', function() {
  var revAll = new RevAll({dontRenameFile: [/\.html/, /CNAME$/, /humans\.txt/], dontUpdateReference: [/humans\.txt/]});

  gulp.src('dist/**')
  .pipe(revAll.revision())
  .pipe(size({
    showFiles: true,
    gzip: true
  }))
  .pipe(gulp.dest('dist'));
});

gulp.task('dev', function() {
  runSequence('compile', 'browser-sync', 'watch');
});

gulp.task('build', ['clean'], function() {
  runSequence(['files', 'html', 'images', 'stylesheets'], 'rev');
});

gulp.task('deploy', function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});
