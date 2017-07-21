(function () {


"use strict";


let mimock  = require('./../dist/mimock.js');
let mockset = mimock.mockset;

if (typeof window === 'undefined')
	require('chai-jasmine');


describe('object type', function () {

	let mocks = new mockset();

	let fobo_object_type;
	let fobo_obj;

	it('instantiated', function () {
		fobo_object_type = mocks.object_type({
			cons: function (params) {
				this.foo_val = params.foo;
				this.bar_val = params.bar;
			},
			methods: {
				param: function (name) {
					return this.param[name];
				},
				foo: function (new_val) {
					let orig_val = this.foo_val;
					if ('0' in arguments)
						this.foo_val = new_val;
					return orig_val;
				},
				bar: function (new_val) {
					let orig_val = this.bar_val;
					if ('0' in arguments)
						this.bar_val = new_val;
					return orig_val;
				},
			},
		});

	});

	it('object instantiated', function () {

		fobo_obj = new fobo_object_type({
			foo:    'f1',
			bar:    'b1',
			});

		expect(fobo_obj.constructor === fobo_object_type).toBe(true);

	});

	it('mocked object methods work', function () {

		let foo     = fobo_obj.foo();
		let old_bar = fobo_obj.bar('b2');
		let bar     = fobo_obj.bar();

		expect(foo).toEqual('f1');
		expect(old_bar).toEqual('b1');
		expect(bar).toEqual('b2');

	});

	let useless_object_type;

	it('minimum instantiated', function () {

		useless_object_type = mocks.object_type();

	});

	it('minimum object instantiated', function () {

		let useless_object = new useless_object_type();

	});

});


})();
