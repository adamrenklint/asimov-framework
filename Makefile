install:
	@npm install && npm install -g nodemon

start:
	@node main.js

debug:
	@VERBOSE=true node main.js

open:
	@node main.js --open

test:
	istanbul cover _mocha -- tests/parsers/PageParser.test.js -R spec
	# istanbul cover _mocha -- tests/**.test.js -R spec
	# @node main.js --test

test-watch:
	@nodemon main.js --test

publish:
	@make test && make force-publish

force-publish:
	@npm publish --dd
	@git tag "v$(shell node -e "var config = require('./package.json'); console.log(config.version);")"
	@git push --tags

.PHONY: install start test test-watch publish force-publish