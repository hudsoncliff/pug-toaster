const { gulp, parallel, src, dest, watch, series } = require('gulp'),
pug = require('gulp-pug'),
sass = require('gulp-sass')(require('sass')),
cleanCss = require('gulp-clean-css'),
autoprefixer = require('gulp-autoprefixer'),
notify = require('gulp-notify'),
plumber = require('gulp-plumber'),
browserSync = require('browser-sync'),
changed = require('gulp-changed'),
imagemin = require('gulp-imagemin'),
imageminJpg = require('imagemin-jpeg-recompress'),
imageminPng = require('imagemin-pngquant'),
imageminGif = require('imagemin-gifsicle'),
svgmin = require('gulp-svgmin'),
through2 = require('through2'),
terser = require('gulp-terser'),
browserify = require('browserify'),
babelify = require('babelify'),
paths = {
    // html: ['src/**/*.pug', '!' + 'src/**/_*.pug'],
    root:       './assets',
    src:        'src/',
    assets:     'assets/',
    html:       'views/',
    css:        'css/',
    js:         'js/',
    img:        'img/',
};

const buildHtml = () => {
    return src(paths.src + paths.html + '**/*.pug')
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(dest(paths.assets));
}

const normalScss = () => {
    return src([paths.src + paths.css + '**/*.scss','!' + paths.src + paths.css + 'style_parts/**/*.scss'])
    .pipe(plumber({
        errorHandler: notify.onError("Error: <%= error.message %>")
    }))
    .pipe(sass({ outputStyle: 'compressed'}))
    .pipe(autoprefixer())
    .pipe(cleanCss({debug: true}, (details) => {
        console.log(`${details.name}: ${details.stats.originalSize}`);
        console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(dest(paths.assets + paths.css));
}

//jsファイルのトランスパイル
const jsTrans = () => {

    return src([paths.src + paths.js + '**/*.js' ,'!' + paths.src + paths.js + '**/foundation/*.js'])
    .pipe(through2.obj((file, enc, callback) => {
      browserify(file.path)
        .transform('babelify', { presets: ['@babel/env'] })
        .bundle((err, buf) => {
          if (err !== null) {
            return callback(new PluginError('browserify', err, {
              showProperties: true,
            }));
          }
          file.contents = buf;
          callback(err, file);
        });
    }))
    .pipe(terser())
    .pipe(dest(paths.assets + paths.js));

}

// jpg,png,gif画像の圧縮タスク
const imgMinify = () => {
    var srcGlob = paths.src + paths.img + '**/*.+(jpg|jpeg|png|gif)';
    var dstGlob = paths.assets + paths.img;
    return src( srcGlob )
    .pipe(plumber())
    .pipe(changed( dstGlob ))
    .pipe(imagemin([
        imageminPng(),
        imageminJpg(),
        imageminGif({
            interlaced: false,
            optimizationLevel: 3,
            colors:180
        })
    ]))
    .pipe(dest( dstGlob ));
}

// svg画像の圧縮タスク
const svgMinify = () => {
    var srcGlob = paths.src + paths.img + '/**/*.+(svg)';
    var dstGlob = paths.assets + paths.img;
    return src( srcGlob )
    .pipe(changed( dstGlob ))
    .pipe(svgmin())
    .pipe(dest( dstGlob ));
}

const browserSyncOption = {
  server: {
      baseDir: paths.root
  },
  port: 8080,
  reloadOnRestart: true
};

const serverInit = (done) => {
    browserSync.init(browserSyncOption);
    done();
}

exports.build = parallel(
    buildHtml,
    normalScss,
    imgMinify,
    svgMinify,
    jsTrans,
    serverInit
);

exports.watch = () =>  {
    watch(paths.src + paths.html + '**/*.pug', buildHtml)
    watch(paths.src + paths.css + '**/*.scss', normalScss)
    watch(paths.src + paths.js + '**/*.js', jsTrans)
};

