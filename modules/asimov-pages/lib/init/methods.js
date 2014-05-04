function registerPathSetter (asimov, type) {

	var name = type + 'Path';

	asimov.config.paths = asimov.config.paths || {};
	asimov.config.paths[type] = asimov.config.paths[type] || [];

	asimov.register(name, function (path) {
		asimov.logPending('pages', 'Adding path for ' + type + ' @ ' + path);
		asimov.config.paths[type].push(path);
	});
}

module.exports = function (next, asimov) {

	//helper

	registerPathSetter(asimov, 'pages');
	
	next();
};
