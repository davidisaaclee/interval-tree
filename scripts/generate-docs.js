const fs = require('fs');
const path = require('path');
const builddocs = require('builddocs');
const mkdirp = require('mkdirp');
const pug = require('pug');
const sass = require('node-sass');

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

const renderedStyles = sass.renderSync({
	file: path.join(__dirname, 'templates', 'style.scss'),
});

const outputDir =
	path.join(__dirname, '..', 'docs');
const htmlOutputPath =
	path.join(outputDir, 'index.html');
const stylesOutputPath =
	path.join(outputDir, 'style.css');

mkdirp(outputDir, function (err) {
	if (err != null) {
		console.error(err);
	} else {
		fs.writeFileSync(htmlOutputPath, outputString, { encoding: 'utf8' });
		fs.writeFileSync(stylesOutputPath, renderedStyles.css, { encoding: 'utf8' });
	}
});


