#! /usr/bin/env node

/**
 * Rolldash - The minimalist lodash minified builder for node
 * Flynn Buckingham - 2018
 */

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const semver = require('semver');
const minimist = require('minimist');

const { rollup } = require('rollup');
const replace = require('rollup-plugin-replace');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');

const generateExports = require('./lib/generateExports');
const defaults = require('./defaults.json');

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
 */
(async () => {
	const {
		version, output, config,
	} = minimist(process.argv.slice(2), {
		default: defaults,
		alias: {
			version: 'v',
			output: 'o',
			config: 'c',
		}
	});

	if (!version) throw missingArg('lodash version');
	if (!config) throw missingArg('config filepath');
	if (!output) throw missingArg('output filepath');

	if (version !== 'latest' && !semver.valid(version)) {
		throw new Error(`${version} is not a valid package version. Use a valid semver or "latest" to install lodash`);
	}

	// attempt to load configuration
	const configPath = path.resolve(config);
	if (!fs.existsSync(configPath)) throw new Error(`${configPath} is not a valid path`);

	// load user configuration
	const { use, compressor } = require(configPath);

	// download specified lodash version to temp directory
	const tmp = path.join(__dirname, 'tmp');
	const LODASH_BASE = path.join(tmp, './node_modules/lodash');

	console.log(`fetching lodash@${version}...`);
	await asyncSpawn('npm', ['i', '--no-save', '--only=prod', '--prefix', tmp, `lodash@${version}`]);

	// generate list of exports
	const {
		EXPORT_LIST,
		IMPORT_INJECT,
		EXPORT_INJECT
	} = generateExports(use, LODASH_BASE);

	console.log(`exporting the following Lodash modules: ${EXPORT_LIST.join(', ')}...`);
	console.log(__dirname);

	// build
	const build = await rollup({
		input: path.join(__dirname, './lib/module'),
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
				include: path.join(tmp, '/**'),
			}),
			uglify({
				compress: compressor,
			})
		],
	});

	// output
	await build.write({
		format: 'cjs',
		file: output,
	});

	console.log(`minified build file written to ${path.resolve(output)}`);
})().catch(e => console.error(e));
