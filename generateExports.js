const lodash = require('lodash');
const loadashExportKeys = Object.keys(lodash);

/**
 * Filters out non-unique values from Array
 */
const uniqueFilter = array => item =>
	array.indexOf(item) !== -1;

/**
 * Filters items not patching regexp
 */
const matchesRegExpFilter = regexp =>
	item => (item.match(regexp) ? true : false);

/**
 * Converts list of exports into lodash import/export statements for treeshaking
 * @param  {Array} exports The exports found
 * @return {Object} Collection of values used for injection into bundle module
 */
module.exports = (exports) => {
	/**
	 * List of filtered exports based on passed regexp and strings
	 * @type {Array}
	 */
	const EXPORT_LIST = [].concat(...exports.map((exportName) => {
		// if string attempt direct comparison
		if (typeof exportName === 'string') {
			return loadashExportKeys.indexOf(exportName) !== -1 ? [exportName] : [];
		}

		// if RegExp attempt filtered comparison
		if (exportName instanceof RegExp) {
			return loadashExportKeys.filter(matchesRegExpFilter(exportName));
		}

		// otherwise return empty
		return [];
	})).filter(uniqueFilter);

	/**
	 * Raw import string value used for injection
	 * @type {String}
	 */
	const IMPORT_INJECT = EXPORT_LIST.map(exportName =>
		`import ${exportName} from 'lodash/${exportName}';`).join('\n');

	/**
	 * Raw export string value used for injection
	 * @type {String}
	 */
	const EXPORT_INJECT = `export { ${EXPORT_LIST.join(', ')} };`;

	return {
		EXPORT_LIST,
		IMPORT_INJECT,
		EXPORT_INJECT,
	};
}
