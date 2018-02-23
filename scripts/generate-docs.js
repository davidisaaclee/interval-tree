const fs = require('fs');
const path = require('path');
const builddocs = require('builddocs');
const mkdirp = require('mkdirp');
const pug = require('pug');

const renderedDocumentation = builddocs.build({
	name: 'interval-tree',
	files: path.join(__dirname, '..', 'src', 'index.js'),
	main: path.join(__dirname, 'templates', 'main.md'),
	allowUnresolvedTypes: true
});

const outputString = 
	pug.renderFile(
		path.join(__dirname, 'templates', 'container.pug'),
		{ renderedDocumentation });

const outputPath =
	path.join(__dirname, '..', 'docs', 'index.html');

mkdirp(path.dirname(outputPath), function (err) {
	if (err != null) {
		console.error(err);
	} else {
		fs.writeFileSync(outputPath, outputString, { encoding: 'utf8' });
	}
});

