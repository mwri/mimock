var path = require('path');

module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: '\n\n',
				stripBanners: { line: true },
				banner: '// Package: <%= pkg.name %> v<%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>)\n// Copyright: (C) 2017 <%= pkg.author.name %> <<%= pkg.author.email %>>\n// License: <%= pkg.license %>\n\n\n',
			},
			es6: {
				src: ['lib/**/*.js'],
				dest: 'dist/<%= pkg.name %>.js',
			},
		},

		strip_code: {
			options: {
				blocks: [{
					start_block: "/* test-code */",
					end_block: "/* end-test-code */",
				}],
			},
			your_target: {
				src: "dist/*.js",
			},
		},

		jshint: {
			files: ['gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
			options: {
				esversion: 6,
				laxbreak:  true,
				'-W058':   true,
				validthis: true,
			},
		},

		karma: {
			es6: {
				options: {
					files: [
						'test/!(lib).js',
					],
					basePath:    '',
					urlRoot:     '/',
					frameworks:  ['jasmine'],
					port:        9876,
					colors:      true,
					autoWatch:   false,
					interval:    200,
					singleRun:   true,
					browsers:    ['ChromeHeadless'],
					reporters:     ['spec'],
					preprocessors: {
						'test/**/*.js':   ['webpack'],
						},
					concurrency: Infinity,
					webpack: require('./webpack.config.js'),
				},
			},
			travis_ci_es6: {
				options: {
					files: [
						'test/!(lib).js',
					],
					basePath:    '',
					urlRoot:     '/',
					frameworks:  ['jasmine'],
					port:        9876,
					colors:      true,
					autoWatch:   false,
					interval:    200,
					singleRun:   true,
					browsers:    ['ChromeTravisCI'],
					reporters:     ['spec'],
					preprocessors: {
						'test/**/*.js':   ['webpack'],
						},
					concurrency: Infinity,
					webpack: require('./webpack.config.js'),
					customLaunchers: {
						ChromeTravisCI: {
							base:  'Chrome',
							flags: ['--no-sandbox']
						},
					},
				},
			},
		},

		node_mocha: {
			es6: {
				src: ['test/**/*.js'],
				options: {
					slow: 3000,
					timeout: 5000,
					reportFormats:  ['lcov'],
					runCoverage:    true,
				},
			},
			es6_nocov: {
				src:  ['test/**/*.js'],
				options: {
					slow:      3000,
					timeout:   5000,
					fullTrace: true,
				},
			},
		},

		watch: {
			full: {
				options: {
					spawn: true,
				},
				files: [
					'lib/**/*.js',
					'test/**/*.js',
				],
				tasks: ['build'],
			},
			dev: {
				options: {
					spawn: true,
				},
				files: [
					'lib/**/*.js',
					'test/**/*.js',
				],
				tasks: ['dev'],
			},
		},

	});

	grunt.registerTask('build', [
		'jshint',
		'concat:es6',
		'karma:es6',
		'node_mocha:es6',
		'strip_code',
		]);

	grunt.registerTask('travis_ci_build', [
		'jshint',
		'concat:es6',
		'karma:travis_ci_es6',
		'node_mocha:es6',
		'strip_code',
		]);

	grunt.registerTask('dev', [
		'jshint',
		'concat:es6',
		'node_mocha:es6_nocov',
		]);

	grunt.registerTask('default', ['build']);
	grunt.registerTask('test',    ['build']);

	grunt.registerTask('watch_dev',  ['watch:dev']);
	grunt.registerTask('watch_full', ['watch:full']);

};
