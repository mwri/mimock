(function () {


"use strict";


let mimock  = require('./../dist/mimock.js');
let mockset = mimock.mockset;

if (typeof window === 'undefined')
	require('chai-jasmine');


describe('lib', function () {

	describe('instantiation', function () {

		it('with lib name works', function () {
			let mocks = new mockset();
			let testob_lib = mocks.library('testob');
			mocks.restore();
		});

		it('shortcut l works', function () {
			let mocks = new mockset();
			let testob_lib = mocks.l('testob');
			mocks.restore();
		});

		it('with non name fails', function (done) {
			let mocks = new mockset();
			try {
				let testob_lib = mocks.library(5);
				throw new Error('exception should have been thrown');
			} catch (err) {
				if (/not a lib/.exec(err))
					done();
				else
					throw err;
			}
			mocks.restore();
		});

		it('is per lib name/path', function () {
			let mocks = new mockset();
			let lib1 = mocks.library('testob');
			let lib2 = mocks.library('testob');
			let lib3 = mocks.library('polylock');
			expect(lib1).toBe(lib2);
			expect(lib1).not.toBe(lib3);
			mocks.restore();
		});

		it('is ok with weird exports', function () {
			let mocks = new mockset();
			let export_number_lib = mocks.library('./node_modules/export_number');
			let export_number = require('./node_modules/export_number');
			expect(export_number).toBe(8);
			mocks.restore();
		});

	});

	describe('export', function () {

		describe('instantiation', function () {

			it('undefined works', function () {
				let mocks = new mockset();
				let lib = mocks.library('polylock');
				let ex = lib.export();
				mocks.restore();
			});

			it('named works', function () {
				let mocks = new mockset();
				let lib = mocks.library('polylock');
				let ex = lib.export('foo');
				mocks.restore();
			});

			it('non undefined non string fails', function (done) {
				let mocks = new mockset();
				let lib = mocks.library('polylock');
				try {
					let ex = lib.export(5);
					throw new Error('exception should have been thrown');
				} catch (err) {
					if (/not an export name and not undefined/.exec(err))
						done();
					else
						throw err;
				}
				mocks.restore();
			});

		});

	});

	describe('instrumentation', function () {

		it('require works', function () {
			let mocks = new mockset();
			let testob_lib = mocks.l('testob');
			let testob = require('testob');
			expect(testob).not.toBe(undefined);
			mocks.restore();
		});

		it('require with non existing module fails on require', function (done) {
			let mocks = new mockset();
			let testob_lib = mocks.library('dont-find-me-if-you-cant');
			try {
				let not_likely = require('dont-find-me-if-you-cant');
				throw new Error('exception should have been thrown');
			} catch (err) {
				if (/Cannot find module/.exec(err))
					done();
				else
					throw err;
			}
			mocks.restore();
		});

		it('require count works', function () {
			let mocks = new mockset();
			let testob_lib = mocks.l('testob');
			expect(testob_lib.require_count()).toBe(0);
			let testob = require('testob');
			expect(testob_lib.require_count()).toBe(1);
			mocks.restore();
		});

		it('instance is per modules.export (same export)', function () {
			let mocks = new mockset();
			let testob_lib = mocks.l('testob');
			let testob1 = require('testob');
			let testob2 = require('testob');
			expect(testob_lib.require_count()).toBe(2);
			expect(testob1).toBe(testob2);
			mocks.restore();
		});

		it('instance is per modules.export (different export)', function () {
			let mocks = new mockset();
			let enc_lib = mocks.l('./node_modules/export_non_constructors.js');
			let enc1 = require('./node_modules/export_non_constructors.js');
			delete require.cache[require.resolve('./node_modules/export_non_constructors.js')];
			let enc2 = require('./node_modules/export_non_constructors.js');
			expect(enc_lib.require_count()).toBe(2);
			expect(enc1).not.toBe(enc2);
			mocks.restore();
		});

		it('require count work (multiple libs)', function () {
			let mocks = new mockset();
			let testob_lib = mocks.l('testob');
			let polylock_lib = mocks.l('polylock');
			expect(testob_lib.require_count()).toBe(0);
			let testob = require('testob');
			expect(typeof testob).toBe('object');
			expect(testob_lib.require_count()).toBe(1);
			expect(polylock_lib.require_count()).toBe(0);
			let polylock = require('polylock');
			expect(typeof polylock).toBe('function');
			expect(polylock_lib.require_count()).toBe(1);
			expect(testob_lib.require_count()).toBe(1);
			require('testob');
			require('testob');
			require('polylock');
			expect(polylock_lib.require_count()).toBe(2);
			expect(testob_lib.require_count()).toBe(3);
			mocks.restore();
		});

		describe('module.exports function', function () {

			it('constructor works', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				mocks.restore();
			});

			it('constructor works (extra arbitrary useless export)', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let useless_export = polylock_lib.e('useless');
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				mocks.restore();
			});

			it('call count works (export before require)', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				locks = new polylock();
				locks = new polylock();
				expect(root_export.call_count()).toBe(3);
				mocks.restore();
			});

			it('call count works (export before require, extra arbitrary useless export)', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let useless_export = polylock_lib.e('useless');
				let polylock = require('polylock');
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				locks = new polylock();
				locks = new polylock();
				expect(root_export.call_count()).toBe(3);
				mocks.restore();
			});

			it('call history works (export before require)', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				expect(root_export.calls()).toEqual([]);
				let caller_called = new Date();
				let locks = new polylock({write_priority:true});
				expect(root_export.call_count()).toBe(1);
				let calls = root_export.calls();
				expect(calls.length).toBe(1);
				expect(calls[0].called.constructor).toBe(Date);
				expect(calls[0].returned.constructor).toBe(Date);
				expect(calls[0].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[0].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() >= 0).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() <= 100).toBe(true);
				expect(calls[0].args).toEqual([{write_priority:true}]);
				expect(typeof calls[0].retval).toBe('object');
				expect(calls[0].retval.drain_for_writes).toBe(true);
				expect(typeof locks).toBe('object');
				mocks.restore();
			});

			it('works when require before export', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let polylock = require('polylock');
				let root_export = polylock_lib.e();
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				let calls = root_export.calls();
				expect(calls.length).toBe(1);
				mocks.restore();
			});

			it('stops after export restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				root_export.restore();
				locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after lib restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				polylock_lib.restore();
				locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let polylock = require('polylock');
				expect(root_export.call_count()).toBe(0);
				let locks = new polylock();
				expect(root_export.call_count()).toBe(1);
				mocks.restore();
				locks = new polylock();
				expect(root_export.call_count()).toBe(1);
			});

		});

		describe('module.exports object sub constructor', function () {

			it('constructor works', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(typeof basic_object).toBe('object');
				expect(basic_object.return_true()).toBe(true);
				expect(basic_object.return_false()).toBe(false);
				mocks.restore();
			});

			it('constructor works (extra non existing sub export)', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let cant_find_me_export = testob_lib.e('cant_find_me');
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(typeof basic_object).toBe('object');
				expect(basic_object.return_true()).toBe(true);
				expect(basic_object.return_false()).toBe(false);
				mocks.restore();
			});

			it('call count works', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				basic_object = new testob_basic();
				basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(3);
				mocks.restore();
			});

			it('call count for non existing sub export is 0', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let cant_find_me_export = testob_lib.e('cant_find_me');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				expect(cant_find_me_export.call_count()).toBe(0);
				mocks.restore();
			});

			it('call history works', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.calls()).toEqual([]);
				let caller_called = new Date();
				let basic_object = new testob_basic({attribs:{aa:5}});
				expect(basic_export.call_count()).toBe(1);
				let calls = basic_export.calls();
				expect(calls.length).toBe(1);
				expect(calls[0].called.constructor).toBe(Date);
				expect(calls[0].returned.constructor).toBe(Date);
				expect(calls[0].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[0].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() >= 0).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() <= 100).toBe(true);
				expect(calls[0].args).toEqual([{attribs:{aa:5}}]);
				expect(typeof calls[0].retval).toBe('object');
				expect(calls[0].retval.attribs.aa).toBe(5);
				expect(typeof basic_object).toBe('object');
				caller_called = new Date();
				basic_object = new testob_basic({attribs:{ab:6}});
				expect(basic_export.call_count()).toBe(2);
				calls = basic_export.calls();
				expect(calls.length).toBe(2);
				expect(calls[1].called.constructor).toBe(Date);
				expect(calls[1].returned.constructor).toBe(Date);
				expect(calls[1].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[1].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[1].returned.getTime()-calls[1].called.getTime() >= 0).toBe(true);
				expect(calls[1].returned.getTime()-calls[1].called.getTime() <= 100).toBe(true);
				expect(calls[1].args).toEqual([{attribs:{ab:6}}]);
				expect(typeof calls[1].retval).toBe('object');
				expect(calls[1].retval.attribs.ab).toBe(6);
				expect(typeof basic_object).toBe('object');
				mocks.restore();
			});

			it('call history for non existing sub export is empty', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let cant_find_me_export = testob_lib.e('cant_find_me');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.calls().length).toBe(0);
				expect(cant_find_me_export.calls().length).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.calls().length).toBe(1);
				expect(cant_find_me_export.calls().length).toBe(0);
				mocks.restore();
			});

			it('works when require before export', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let testob = require('testob');
				let basic_export = testob_lib.e('basic');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				let calls = basic_export.calls();
				expect(calls.length).toBe(1);
				mocks.restore();
			});

			it('stops after export restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				basic_export.restore();
				basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after lib restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				testob_lib.restore();
				basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let testob = require('testob');
				let testob_basic = testob.basic;
				expect(basic_export.call_count()).toBe(0);
				let basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
				mocks.restore();
				basic_object = new testob_basic();
				expect(basic_export.call_count()).toBe(1);
			});

		});

		describe('module.exports object non constructor function', function () {

			it('function works', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(enc.return_true()).toBe(true);
				expect(enc.return_false()).toBe(false);
				mocks.restore();
			});

			it('function works (extra arbitrary useless export)', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let not_existing_export = enc_lib.e('not_existing');
				let enc = require('./node_modules/export_non_constructors');
				expect(enc.return_true()).toBe(true);
				expect(enc.return_false()).toBe(false);
				mocks.restore();
			});

			it('call count works (export before require)', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				expect(enc.return_true()).toBe(true);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(3);
				mocks.restore();
			});

			it('call count works (export before require, extra arbitrary useless export)', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let not_existing_export = enc_lib.e('not_existing');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				expect(enc.return_true()).toBe(true);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(3);
				mocks.restore();
			});

			it('call history works (export before require)', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				let caller_called = new Date();
				expect(enc.return_true()).toBe(true);
				let calls = ret_true_export.calls();
				expect(calls.length).toBe(1);
				expect(calls[0].called.constructor).toBe(Date);
				expect(calls[0].returned.constructor).toBe(Date);
				expect(calls[0].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[0].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() >= 0).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() <= 100).toBe(true);
				expect(calls[0].args).toEqual([]);
				expect(calls[0].retval).toBe(true);
				mocks.restore();
			});

			it('works when require before export', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let enc = require('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after export restore', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				ret_true_export.restore();
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after lib restore', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				enc_lib.restore();
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let enc_lib = mocks.l('./node_modules/export_non_constructors');
				let ret_true_export = enc_lib.e('return_true');
				let enc = require('./node_modules/export_non_constructors');
				expect(ret_true_export.call_count()).toBe(0);
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
				mocks.restore();
				expect(enc.return_true()).toBe(true);
				expect(ret_true_export.call_count()).toBe(1);
			});

		});

	});

	describe('wrap', function () {

		describe('with module.exports function', function () {

			it('wrapped constructor works', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				root_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				expect(wrap_seen).toBe(1);
				locks = new polylock();
				expect(wrap_seen).toBe(2);
				mocks.restore();
			});

			it('stops after unwrap', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				let wrap_fun = function (helper) {
					wrap_seen++;
					return helper.continue();
				};
				root_export.wrap(wrap_fun);
				let polylock = require('polylock');
				let locks = new polylock();
				expect(wrap_seen).toBe(1);
				expect(root_export.unwrap(wrap_fun)).toBe(1);
				locks = new polylock();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('alien function unwrap ignored', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				let wrap_fun = function (helper) {
					wrap_seen++;
					return helper.continue();
				};
				root_export.wrap(wrap_fun);
				let polylock = require('polylock');
				let locks = new polylock();
				expect(wrap_seen).toBe(1);
				expect(root_export.unwrap(function () {})).toBe(0);
				locks = new polylock();
				expect(wrap_seen).toBe(2);
				mocks.restore();
			});

			it('stops after wrap restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				let mm_restorable = root_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				expect(wrap_seen).toBe(1);
				mm_restorable.restore();
				locks = new polylock();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after export restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				root_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				expect(wrap_seen).toBe(1);
				root_export.restore();
				locks = new polylock();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after lib restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				root_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				expect(wrap_seen).toBe(1);
				polylock_lib.restore();
				locks = new polylock();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				let wrap_seen = 0;
				root_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let polylock = require('polylock');
				let locks = new polylock();
				expect(typeof locks).toBe('object');
				expect(wrap_seen).toBe(1);
				mocks.restore();
				locks = new polylock();
				expect(wrap_seen).toBe(1);
			});

			it('throws error after restored', function () {
				let mocks = new mockset();
				let polylock_lib = mocks.l('polylock');
				let root_export = polylock_lib.e();
				root_export.wrap(function (helper) { return helper.continue(); });
				root_export.restore();
				try {
					root_export.wrap(function (helper) { return helper.continue(); });
					throw new Error('should have thrown exception');
				} catch (err) {
					if (!/export is restored/.exec(err))
						throw err;
				}
			});

		});

		describe('with module.exports object sub constructor', function () {

			it('wrapped constructor works', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				basic_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(typeof basic_object).toBe('object');
				expect(basic_object.return_true()).toBe(true);
				expect(basic_object.return_false()).toBe(false);
				expect(wrap_seen).toBe(1);
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(2);
				mocks.restore();
			});

			it('stops after unwrap', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				let wrap_fun = function (helper) {
					wrap_seen++;
					return helper.continue();
				};
				basic_export.wrap(wrap_fun);
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				basic_export.unwrap(wrap_fun);
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after wrap restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				let mm_restorable = basic_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mm_restorable.restore();
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after export restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				let mm_restorable = basic_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				basic_export.restore();
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after lib restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				let mm_restorable = basic_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				testob_lib.restore();
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mocks.restore();
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let testob_lib = mocks.l('testob');
				let basic_export = testob_lib.e('basic');
				let wrap_seen = 0;
				let mm_restorable = basic_export.wrap(function (helper) {
					wrap_seen++;
					return helper.continue();
				});
				let testob = require('testob');
				let testob_basic = testob.basic;
				let basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
				mocks.restore();
				basic_object = new testob_basic();
				expect(wrap_seen).toBe(1);
			});

		});

	});

});


})();
