const path = require("path");

module.exports = {
	entry: "./webpack_entry.js",
	output: {
		path: __dirname,
		filename: "./webpack_bundle.js",
	},
	resolve: {
		modules: [
			path.resolve(__dirname, "./node_modules"),
			__dirname,
			],
	},
	target: 'node',
};
