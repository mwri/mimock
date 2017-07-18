'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// Package: mimock v0.1.0 (built 2017-07-18 09:41:07)
// Copyright: (C) 2017 Michael Wright <mjw@methodanalysis.com>
// License: MIT


(function () {

	'use strict';

	var mimock_mockset = function () {

		var mimock_mockset = function mimock_mockset() {

			this.mm_objs = [];
		};

		mimock_mockset.prototype.object_type = function (params) {

			if (typeof params === 'undefined') params = {};

			var cons = 'cons' in params ? params.cons : function () {};

			var method_names = 'methods' in params ? Object.keys(params.methods) : [];

			for (var i = 0; i < method_names.length; i++) {
				cons.prototype[method_names[i]] = params.methods[method_names[i]];
			}return cons;
		};

		mimock_mockset.prototype.object = function (raw_obj) {

			if ((typeof raw_obj === 'undefined' ? 'undefined' : _typeof(raw_obj)) !== 'object') throw new Error('not an object');

			for (var i = 0; i < this.mm_objs.length; i++) {
				if (this.mm_objs[i].raw_obj === raw_obj) return this.mm_objs[i];
			}var mm_obj = new mimock_obj(this, raw_obj);
			this.mm_objs.push(mm_obj);

			return mm_obj;
		};

		mimock_mockset.prototype.o = mimock_mockset.prototype.object;

		mimock_mockset.prototype.restore = function () {

			var mm_objs = this.mm_objs;
			for (var i = mm_objs.length - 1; i >= 0; i--) {
				mm_objs[i].restore();
			}
		};

		return mimock_mockset;
	}();

	var mimock_obj = function () {

		var mimock_obj = function mimock_obj(mm_set, raw_obj) {

			this.mm_set = mm_set;
			this.raw_obj = raw_obj;
			this.mm_methods = [];
		};

		mimock_obj.prototype.method = function (method_name) {

			if (typeof this.raw_obj[method_name] !== 'function') throw new Error('not a function');

			for (var i = 0; i < this.mm_methods.length; i++) {
				if (this.mm_methods[i].method_name === method_name) return this.mm_methods[i];
			}var mm_method = new mimock_method(this.mm_set, this, method_name);
			this.mm_methods.push(mm_method);

			return mm_method;
		};

		mimock_obj.prototype.m = mimock_obj.prototype.method;

		mimock_obj.prototype.restore = function () {

			var mm_methods = this.mm_methods;
			for (var i = 0; i < mm_methods.length; i++) {
				mm_methods[i].restore();
			}
		};

		return mimock_obj;
	}();

	var mimock_method = function () {

		var mimock_method = function mimock_method(mm_set, mm_obj, method_name) {

			var raw_obj = mm_obj.raw_obj;

			this.mm_set = mm_set;
			this.mm_obj = mm_obj;
			this.method_name = method_name;
			this.orig_fun = raw_obj[this.method_name];
			this.wrap_chain = [];
			this.call_hist = [];
			this.active = true;

			var mm_method = this;
			raw_obj[this.method_name] = function () {
				return mm_method.entry(Array.prototype.slice.call(arguments));
			};
		};

		mimock_method.prototype.entry = function (args) {

			var result = {
				called: new Date(),
				args: args
			};

			var helper = new mimock_wrap_helper(this, args);

			var retval = void 0;
			var exception = void 0;
			try {
				retval = helper.continue();
			} catch (caught) {
				exception = caught;
			}

			result.returned = new Date();
			this.call_hist.push(result);

			if (typeof exception === 'undefined') {
				result.retval = retval;
				return retval;
			} else {
				result.exception = exception;
				throw exception;
			}
		};

		mimock_method.prototype.wrap = function (wrap_fun) {

			this.wrap_chain.push(wrap_fun);
		};

		mimock_method.prototype.call_count = function () {

			return this.call_hist.length;
		};

		mimock_method.prototype.calls = function () {

			return this.call_hist;
		};

		mimock_method.prototype.restore = function () {

			this.mm_obj.raw_obj[this.method_name] = this.orig_fun;

			this.active = false;
			this.wrap_chain = [];
		};

		return mimock_method;
	}();

	var mimock_wrap_helper = function () {

		var mimock_wrap_helper = function mimock_wrap_helper(mm_method, method_args) {

			this.mm_method = mm_method;
			this.mm_obj = mm_method.mm_obj;
			this.args = method_args;
			this.wrap_num = mm_method.wrap_chain.length;
		};

		mimock_wrap_helper.prototype.continue = function () {

			if (this.wrap_num == 0) return this.mm_method.orig_fun.apply(this.mm_obj.raw_obj, this.args);

			this.wrap_num--;

			return this.mm_method.wrap_chain[this.wrap_num].apply(this.mm_obj.raw_obj, [this]);
		};

		return mimock_wrap_helper;
	}();

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = {
			mockset: mimock_mockset
		};
	} else {
		window.mockset = mimock_mockset;
	}
})();
