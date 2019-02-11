var gulp = require('gulp');
var pug = require('gulp-pug');
var sass = require('gulp-sass');
var cleanCss = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var browserSync = require('browser-sync');
var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed');

/**
 * dev dir
 */
var src = {
    'root': 'src/',
    'html': ['src/**/*.pug', '!' + 'src/**/_*.pug'],
    'json': '_data/',
    'js': '**/*.js',
    'css': 'assets/css/**/*.css',
    'sass': 'assets/scss/**/*.scss',
    'img': 'assets/img'
};

/**
 * dest dir
 */ 
var dest = {
    'root': 'dest/',
    'html': 'dest/',
    'css': 'assets/css',
    'js': 'assets/js',
    'img': 'assets/img'
};

gulp.task('html', function() {
    return gulp
        .src(src.html)
        .pipe(pug({
            basedir: 'src',
            pretty: true
        }))
        .pipe(gulp.dest(dest.html))
        .pipe(browserSync.stream());
});

gulp.task('scss', function() {
    return gulp
        .src(src.root + src.sass)
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass({ outputStyle: 'expanded'}))
        .pipe(autoprefixer({browsers: ["last 2 versions"]}))
        .pipe(gulp.dest(dest.root + dest.css))
        .pipe(cleanCss({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(dest.root + dest.css))
        .pipe(browserSync.stream());
});

gulp.task('css', function() {
    return gulp
        .src(src.root + src.css)
        .pipe(cleanCss({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(dest.root + dest.css))
        .pipe(browserSync.stream());
});

gulp.task('js', function() {
    return gulp
        .src(src.root + src.js, {base: src.root})
        .pipe(babel({
            presets: ['@babel/env'],
        }))
        .pipe(gulp.dest(dest.root))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(dest.root))
        .pipe(browserSync.stream());
});

gulp.task('imagemin', function() {
    var srcGlob = src.root + src.img + '/**/*.+(jpg|jpeg|png|gif|svg)';
    var dstGlob = dest.root + dest.img;
    return gulp
        .src( srcGlob )
        .pipe(plumber())
        .pipe(changed( srcGlob ))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 7}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest( dstGlob ));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: dest.root,
            index: "index.html",
        }
    });
    gulp.watch(src.html).on('change', browserSync.reload);
});

gulp.task('watch', function(){
    gulp.watch(src.html, gulp.task('html'));
    gulp.watch(src.root + src.sass, gulp.task('scss'));
    gulp.watch(src.root + src.css, gulp.task('css'));
    gulp.watch(src.root + src.js, gulp.task('js'));
    gulp.watch(src.root + src.img, gulp.task('imagemin'));
});