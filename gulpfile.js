'use strict';

var gulp = require('gulp'),
	$ = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'autoprefixer', 'del', 'main-bower-files', 'uglify-save-license']
	}),
	babelify = require('babelify'),
	browserify = require('browserify'),
	browserSync = require('browser-sync'),
	buffer = require('vinyl-buffer'),
	glob = require('glob'),
	reload = browserSync.reload,
	source = require('vinyl-source-stream'),
	wiredep = require('wiredep').stream;

var options = {
	errorHandler: function(title) {
		var gutil = require('gulp-util'),
			notify = require('gulp-notify');

		return function(err) {
			var errMsg = err.toString();

			notify(errMsg).write(errMsg);
			gutil.log(gutil.colors.red('[' + title + ']'), errMsg);
			this.emit('end');
		};
	},
	autoprefixer: {
		browsers: ['last 2 versions', '> 1%', 'safari >= 8'],
		remove: false
	},
	babelify: {
		plugins: [],
		// Use all of the ES2015 spec
		presets: ['es2015'],
		sourceMaps: true
	},
	browserify: {
		debug: true
	},
	browserSync: {
		debugInfo: true,
		minify: false,
		open: false,
		port: 9000,
		server: {
			baseDir: ['.tmp', 'app'],
			routes: {
				'/bower_components': '../bower_components'
			}
		},
		startPath: '/',
		reloadOnRestart: true,
		watchEvents: ['add', 'change']
	},
	imagemin: {
		optimizationLevel: 3,
		progressive: true,
		interlaced: true,
		/* Don't remove IDs from SVGs, they are often used
		 as hooks for embedding and styling */
		svgoPlugins: [{ cleanupIDs: false }]
	},
	htmlmin: {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		removeEmptyAttributes: true,
		removeAttributeQuotes: true,
		useShortDoctype: true
	},
	sass: {
		errLogToConsole: true,
		includePaths: ['.'],
		outputStyle: 'expanded',
		precision: 10
	},
	sasslint: {
		config: '/.sass-lint.yml'
	},
	/**
	 *  Wiredep is the lib which inject bower dependencies in your project
	 *  Mainly used to inject script tags in the index.html but also used
	 *  to inject css preprocessor deps and js files in karma
	 */
	wiredep: {
		exclude: [],
		// ignorePath: /^(\.\.\/)*\.\./,
		overrides: {
			'jquery-ui': {
				main: ['themes/cupertino/jquery-ui.css', 'jquery-ui.js']
			}
		}
	}
};

gulp.task('styles:lint', function() {
	return gulp.src('app/styles/**/*.scss')
		.pipe($.plumber())
		.pipe($.sassLint(options.sasslint))
		.pipe($.sassLint.format())
		.pipe($.sassLint.failOnError());
});

gulp.task('styles', ['styles:lint', 'images', 'fonts'], function() {
	var postcssPlugins = [
		$.autoprefixer(options.autoprefixer)
	];

	return gulp.src('app/styles/main.scss')
		.pipe($.plumber(options.errorHandler))
		.pipe(wiredep(options.wiredep)).on('error', options.errorHandler('wiredep'))
		.pipe($.sourcemaps.init())
		.pipe($.sass(options.sass)).on('error', options.errorHandler('sass'))
		.pipe($.postcss(postcssPlugins))
		.pipe($.sourcemaps.write())
		.pipe($.rename('main.css'))
		.pipe(gulp.dest('.tmp/styles'));
});

gulp.task('scripts:lint', function() {
	return gulp.src(['app/scripts/**/*.js'])
		.pipe($.jscs())
		.pipe($.jscsStylish())
		.pipe($.eslint())
		.pipe($.eslint.format())
		.pipe($.if(!browserSync.active, $.eslint.failOnError()));
});

gulp.task('scripts', ['scripts:lint'], function() {
	options.browserify.entries = glob.sync('app/scripts/app.js');

	return browserify(options.browserify)
		.transform(babelify, options.babelify)
		.bundle().on('error', options.errorHandler('bundle'))
		.pipe(source('app.js'))
		.pipe(buffer())
		// .pipe($.sourcemaps.init({ loadMaps: true }))
		// .pipe($.sourcemaps.write('./', { includeContent: true }))
		.pipe(gulp.dest('.tmp/scripts'));
});

gulp.task('html', ['wiredep', 'scripts', 'styles'], function() {
	return gulp.src('.tmp/*.html')
		.pipe($.useref({ searchPath: ['.tmp', 'app'] }))
		.pipe($.if('*.css', $.csso()))
		.pipe($.if('*.html', $.minifyHtml({ conditionals: true, loose: true })))
		.pipe(gulp.dest('.tmp'))
		.pipe(gulp.dest('dist'));
});

gulp.task('images', function() {
	return gulp.src(['app/images/**/*', 'app/styles/images/**/*'])
		.pipe($.cache($.imagemin(options.imagemin)))
		.pipe($.if('app/images', gulp.dest('dist/images')))
		.pipe($.if('app/styles', gulp.dest('.tmp/styles/images')))
		.pipe($.size());
});

gulp.task('fonts', function() {
	return gulp.src($.mainBowerFiles().concat('app/fonts/**/*'))
		.pipe($.filter('**/*.{eot,otf,svg,ttf,woff,woff2}'))
		.pipe($.if('*.{eot,svg,ttf,woff}', $.flatten()))
		.pipe(gulp.dest('.tmp/fonts'))
		.pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function() {
	return gulp.src([
			'app/*.*',
			'!app/*.html'
		], {
			dot: true
		}).pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
	return $.del.sync(['.tmp', 'dist'], { force: true });
});

gulp.task('serve', ['html', 'extras'], function() {
	browserSync.init(options.browserSync);

	gulp.watch([
		'.tmp/*.html',
		'.tmp/scripts/app.js',
		'.tmp/styles/**/*',
		'app/images/**/*',
		'.tmp/fonts/**/*'
	], { cwd: './' }).on('change', reload);

	gulp.watch(['bower.json', 'app/index.html'], ['html']);
	gulp.watch('app/scripts/**/*.js', ['scripts']);
	gulp.watch('app/styles/**/*', ['styles']);
	gulp.watch('app/fonts/**/*', ['fonts']);
});

// Inject bower components
gulp.task('wiredep', function() {
	var wiredep = require('wiredep').stream;

	gulp.src('app/*.html')
		.pipe(wiredep(options.wiredep))
		.pipe(gulp.dest('.tmp'));
});

gulp.task('build', ['clean', 'scripts', 'styles', 'html', 'extras'], function() {
	return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

gulp.task('default', ['serve']);
