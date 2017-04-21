var del = require('del'),
    gulp = require('gulp'),
    babel = require('gulp-babel'),
    header = require('gulp-header'),
    uglify = require('gulp-uglify'),
    usemin = require('gulp-usemin'),
    flatmap = require('gulp-flatmap'),
    htmlmin = require('gulp-htmlmin'),
    cleanCSS = require('gulp-clean-css'),
    browserSync = require('browser-sync').create(),
    nunjucksRender = require('gulp-nunjucks-render');



var config = {
    pkg: require('./package.json'),
    banner: [
        '/**',
        ' *',
        ' * Static Here - in <%= new Date().toString() %>',
        ' *',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version <%= pkg.version %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' *',
        ' */',
        ''
    ].join('\n'),
    uglify: {
        mangle: {
            toplevel: true,
            sort: true,
            eval: true,
            props: true // <-- Seemed to have no effect...
        },
        output: {
            // http://lisperator.net/uglifyjs/codegen
            indent_start: 0, // start indentation on every line (only when `beautify`)
            indent_level: 4, // indentation level (only when `beautify`)
            quote_keys: false, // quote all keys in object literals?
            space_colon: true, // add a space after colon signs?
            ascii_only: false, // output ASCII-safe? (encodes Unicode characters as ASCII)
            inline_script: false, // escape "</script"?
            width: 80, // informative maximum line width (for beautified output)
            max_line_len: 32000, // maximum line length (for non-beautified output)
            beautify: false, // beautify output?
            source_map: null, // output a source map
            bracketize: false, // use brackets every time?
            comments: false, // output comments?
            semicolons: true, // use semicolons to separate statements? (otherwise, newlines)
        },
        compress: {
            // http://lisperator.net/uglifyjs/compress
            sequences: true, // join consecutive statemets with the “comma operator”
            properties: true, // optimize property access: a["foo"] → a.foo
            dead_code: true, // discard unreachable code
            drop_debugger: true, // discard “debugger” statements
            unsafe: false, // some unsafe optimizations (see below)
            conditionals: true, // optimize if-s and conditional expressions
            comparisons: true, // optimize comparisons
            evaluate: true, // evaluate constant expressions
            booleans: true, // optimize boolean expressions
            loops: true, // optimize loops
            unused: true, // drop unused variables/functions
            hoist_funs: true, // hoist function declarations
            hoist_vars: false, // hoist variable declarations
            if_return: true, // optimize if-s followed by return/continue
            join_vars: true, // join var declarations
            cascade: true, // try to cascade `right` into `left` in sequences
            side_effects: true, // drop side-effect-free statements
            warnings: true, // warn about potentially dangerous optimizations/code
        }
    }
};



function production() {

    function clean() {
        return del('production/**/*');
    }

    function transform() {

        var lap = 0;

        return gulp.src('./developer/**/*.html')
            .pipe(flatmap(function (stream, file) {

                // console.log(file)
                // console.log(file.path)
                // console.log(lap);

                return stream
                    .pipe(usemin({
                        // https://github.com/zont/gulp-usemin#usage
                        path: './developer/',
                        outputRelativePath: '.',
                        css: [cleanCSS()],
                        html: [function () {
                            // https://github.com/jonschlinkert/gulp-htmlmin
                            // https://github.com/kangax/html-minifier
                            return htmlmin({
                                html5: true,
                                collapseWhitespace: true,
                                removeComments: true,
                                removeEmptyAttributes: true,
                                removeRedundantAttributes: true,
                                collapseBooleanAttributes: true,
                                removeAttributeQuotes: true,
                                removeOptionalTags: true
                            });
                        }],
                        jsVendor: [
                            uglify(config.uglify),
                            header(config.banner, {
                                pkg: config.pkg
                            })
                        ],
                        jsLibrary: [
                            uglify(config.uglify),
                            header(config.banner, {
                                pkg: config.pkg
                            })
                        ],
                        jsApp: [
                            uglify(config.uglify),
                            header(config.banner, {
                                pkg: config.pkg
                            })
                        ],
                        inlinejs: [uglify()],
                        inlinecss: [cleanCSS(), 'concat']
                    }));

            }))
            .pipe(gulp.dest('./production/'));

    }

    var assets = {
        i18n: function i18n() {
            return gulp.src(['./developer/assets/i18n/**/*'])
                .pipe(gulp.dest('./production/assets/i18n/'));
        },
        img: function img() {
            return gulp.src(['./developer/assets/img/**/*'])
                .pipe(gulp.dest('./production/assets/img/'));
        },
        humans: function humans(params) {
            return gulp.src(['./developer/assets/humans.json'])
                .pipe(gulp.dest('./production/assets/'));
        }
    }

    return gulp.series(clean, transform, gulp.parallel(assets.i18n, assets.img, assets.humans));

}


function developer() {

    function clean() {
        return del([
            './developer/**/*',
            // '!./developer/assets',
            // '!./developer/assets/**'
        ]);
    }

    function js() {
        return gulp.src(['./src/assets/js/**/*.js', '!./src/assets/js/vendor/', '!./src/assets/js/vendor/**'])
            .pipe(babel({
                presets: ['es2015'],
                plugins: ["transform-es2015-modules-umd"]
            }))
            .pipe(gulp.dest('./developer/assets/js/'));
    }

    function template() {

        // Gets .html and .nunjucks files in pages
        return gulp.src('src/pages/**/*.+(html|njk)')
            // Renders template with nunjucks
            .pipe(nunjucksRender({
                path: ['src/templates/']
            }))
            // output files in developer folder
            .pipe(gulp.dest('./developer'));

    }

    function assets() {

        function vendor() {
            return gulp.src(['./src/assets/js/vendor/**/*.js'])
                .pipe(gulp.dest('./developer/assets/js/vendor/'));
        }

        function others() {
            return gulp.src(['./src/assets/**/*', '!./src/assets/js', '!./src/assets/js/**'])
                .pipe(gulp.dest('./developer/assets/'));
        }

        return gulp.parallel(vendor, others);

    }

    return gulp.series(clean, template, js, assets());

}


function serve(option, done) {

    console.log(option);

    function clean() {
        return del([
            './developer/**/*',
            // '!./developer/assets',
            // '!./developer/assets/**'
        ]);
    }

    function js() {
        return gulp.src(['./src/assets/js/**/*.js', '!./src/assets/js/vendor/', '!./src/assets/js/vendor/**'])
            .pipe(babel({
                presets: ['es2015'],
                plugins: ["transform-es2015-modules-umd"]
            }))
            .pipe(gulp.dest('./developer/assets/js/'));
    }

    function template() {

        // Gets .html and .nunjucks files in pages
        return gulp.src('src/pages/**/*.+(html|njk)')
            // Renders template with nunjucks
            .pipe(nunjucksRender({
                path: ['src/templates/']
            }))
            // output files in developer folder
            .pipe(gulp.dest('./developer'));

    }

    function assets(execute) {

        function vendor() {
            return gulp.src(['./src/assets/js/vendor/**/*.js'])
                .pipe(gulp.dest('./developer/assets/js/vendor/'));
        }

        function others() {
            return gulp.src(['./src/assets/**/*', '!./src/assets/js', '!./src/assets/js/**'])
                .pipe(gulp.dest('./developer/assets/'));
        }

        if (execute) {
            vendor();
            others();
        }

        return gulp.parallel(vendor, others);

    }

    function reload(done) {
        browserSync.reload();
        done();
    }

    if (option === 'production') {

        browserSync.init({
            server: {
                baseDir: "./production/"
            }
        });

    } else if (option === 'developer') {

        // https://github.com/gulpjs/gulp/blob/4.0/docs/recipes/minimal-browsersync-setup-with-gulp4.md

        browserSync.init({
            server: {
                baseDir: "./developer/"
            }
        });

        template();
        assets(true);

        gulp.watch('./src/**/*', gulp.series(clean, js, template, assets(), reload));

    } else {
        throw new Error('option invalid')
    }

    return done();
}



gulp.task('production', production());
gulp.task('developer', developer());

// gulp serve --env production
// gulp serve --env developer
gulp.task('serve', function (done) {
    // http://stackoverflow.com/questions/28538918/pass-parameter-to-gulp-task
    return serve(process.argv[4], done);
});