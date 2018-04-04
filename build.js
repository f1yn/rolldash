#! /usr/bin/env node

/**
 * Rolldash - The minimalist lodash minified builder for node
 * Flynn Buckingham - 2018
 */

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const semver = require('semver');

const { rollup } = require('rollup');
const replace = require('rollup-plugin-replace');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');

/**
 * Error helper for missing CLI arguments
 * @param  {String} name The name of the missing argument
 * @return {Error} The generated error object based on the provided name
 */
const missingArg = name => new Error(`${name} is an required argument`);

/**
 * Asynchronous wrapper for CLI process spawning. Uses stdout and stderr streams
 * @param  {arguments} args arguments to pass to the spawned process
 * @return {Promise} Resolves when process is complete, otherwise rejects when fails
 */
const asyncSpawn = (...args) => new Promise((resolve, reject) => {
	try {
		const proc = child_process.spawn(...args);
		proc.stdout.on('data', data => process.stdout.write(data));
		proc.stderr.on('data', data => process.stderr.write(data));
		proc.on('exit', resolve);
	} catch (e) {
		console.error(e);
		reject(e);
	}
});

/**
 * Main instance
 * @param  {[type]} async [description]
 * @return {[type]} [description]
 */
(async (version, sourceFile, output) => {
	if (!version) throw missingArg('version');
	if (!sourceFile) throw missingArg('sourceFile');
	if (!output) throw missingArg('output');

	if (version !== 'latest' && !semver.valid(version)) {
		throw new Error(`${version} is not a valid package version. Use a valid semver or "latest" to install lodash`);
	}

	if (!fs.existsSync(path.resolve(sourceFile))) throw new Error(`${sourceFile} is not a valid path`);

	console.log(`fetching lodash@${version}...`);
	await asyncSpawn('npm', ['i', '--no-save', '--only=prod', `lodash@${version}`]);

	// generate list of exports
	const {
		EXPORT_LIST,
		IMPORT_INJECT,
		EXPORT_INJECT
	} = require('./generateExports')(require(path.resolve(sourceFile)));

	console.log(`exporting the following Lodash modules: ${EXPORT_LIST.join(', ')}...`);

	console.log(__dirname);

	const build = await rollup({
		input: path.join(__dirname, './module'),
		plugins: [
			replace({
				IMPORT_INJECT,
				EXPORT_INJECT,
			}),
			nodeResolve({
				jsnext: true,
				main: true,
				module: true,
			}),
			commonjs({
				include: path.resolve('./node_modules/lodash/**'),
			}),
			uglify()
		],
	});

	await build.write({
		format: 'cjs',
		file: output,
	});

	console.log(`minified build file written to ${path.resolve(output)}`);

})(...Array.from(process.argv).slice(2));
