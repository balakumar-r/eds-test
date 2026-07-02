const { src, dest, watch, series } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');

// Compile each component SCSS (exclude partials starting with _) and output CSS next to the SCSS
function styles() {
  return src('blocks/**/[^_]*.scss', { base: 'blocks', sourcemaps: true })
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(sourcemaps.write('.')) // writes .map file next to .css
    .pipe(dest('blocks'));
}

function watchStyles() {
  watch('blocks/**/*.scss', styles);
}

exports.styles = styles;
exports.watch = series(styles, watchStyles);
exports.default = exports.watch;
