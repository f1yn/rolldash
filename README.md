# Rolldash (Node 8+)

This module uses rollup to create a selectively minified build of Lodash using npm
scripts. This package was made in response to the deprecation of the offical
`lodash-cli` utility.

## Usage

### Installation

#### npm-script
```bash
npm i -D flynnham/rolldash
```

### CLI usage (npm-script)

```bash
rolldash LodashNpmVersion ./path/to/configFile.js ./path/to/output.js
```

#### The above (as either an npm script) will do the following

1. Fetches a local copy of Lodash of the specified version
2. Reads the configuration file containing the regex/string names of valid Lodash
exports
3. The build script dynamically generates a build script in memory and uses it to
build a selectively exported version of Lodash locally to the specified output location.


#### Example
```bash
rolldash latest lodash.config.js ./build/lodash.js
```
The above will fetch latest version of Lodash, use `lodash.config.js` in the current
working directory, and output the file to `./build/lodash.js` relative to the current
working directory.

### Configuration
The configuration file used by the build tool is specified
by a simple module export of an Array containing both strings and regular expressions

#### Example configuration file

```javascript
module.exports = [
	'map',
	/difference/,
];
```

The above will match any Lodash exports exactly named `map`, and any exports containing the word `difference`. The build script will output the detected exports when run.
