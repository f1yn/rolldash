
/**
 * Filters out non-unique values from Array
 */
const uniqueFilter = (item, i, array) =>
	array.indexOf(item) !== -1;

/**
 * Filters items not patching regexp
 */
const matchesRegExpFilter = regexp =>
	item => (item.match(regexp) ? true : false);

/**
 * Filters out items in blacklist
 */
const blacklistFilter = blacklist =>
	item => blacklist.indexOf(item) === -1;

/**
 * Converts list of exports into lodash import/export statements for treeshaking
 * @param  {Array} exports The exports found
 * @return {Object} Collection of values used for injection into bundle module
 */
module.exports = (use, LODASH_BASE, blacklist = ['_', 'VERSION', 'noConflict', 'runInContext']) => {
	/**
	 * List of filtered exports based on passed regexp and strings
	 * @type {Array}
	 */
	const lodash = require(LODASH_BASE);
 	const loadashExportKeys = Object.keys(lodash);

	const exports = use || [];

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
	})).filter(uniqueFilter).filter(blacklistFilter(blacklist));

	/**
	 * Raw import string value used for injection
	 * @type {String}
	 */
	const IMPORT_INJECT = EXPORT_LIST.map(exportName =>
		`import ${exportName} from '${LODASH_BASE}/${exportName}';`).join('\n');

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
