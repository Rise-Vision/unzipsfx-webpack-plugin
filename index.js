'use strict';

const path = require('path');
const fs = require('fs');
const RawSource = require('webpack-sources').RawSource;


function UnzipsfxPlugin(options) {
	this.options = options || {};
}

UnzipsfxPlugin.prototype.getData = function(srcPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(srcPath, 'utf8', (err, data) => {
      if (err) reject(err);
      return resolve(data);
    });
  });
}

UnzipsfxPlugin.prototype.getPath = function(compilation, outputPath, outputFilename, extension) {
  let outputPathAndFilename = path.resolve(
    compilation.options.output.path,
    outputPath,
    path.basename(outputFilename, extension)
  );

  let relativeOutputPath = path.relative(
    compilation.options.output.path,
    outputPathAndFilename
  );

  return relativeOutputPath;
}

UnzipsfxPlugin.prototype.apply = function(compiler) {
  const options = this.options;
  const self = this;
	compiler.plugin('emit', function(compilation, callback) {
		// assets from child compilers will be included in the parent
		// so we should not run in child compilers
		if (this.isChild()) {
			callback();
			return;
		}
    const outputPath = options.path || compilation.options.output.path;
    const outputFilename = options.filename || compilation.options.output.filename || path.basename(outputPath);
    const zipFilePath = options.zipFilePath || compilation.options.output.filename + ".zip" || path.basename(outputPath) + ".zip";

    let linuxData = [];
    self.getData(__dirname + "/unzipsfx").then((data)=>{
          linuxData.push(data);
          self.getData(zipFilePath).then((data)=>{
            linuxData.push(data);
            compilation.assets[self.getPath(compilation, outputPath, outputFilename, ".sh")] = new RawSource(Buffer.concat(linuxData));

            let windowsData = [];
            self.getData("unzipsfx.exe").then((data)=>{
                  windowsData.push(data);
                  self.getData(zipFilePath).then((data)=>{
                    windowsData.push(data);
                    compilation.assets[self.getPath(compilation, outputPath, outputFilename, ".exe")] = new RawSource(Buffer.concat(windowsData));
                    callback();
                  });
            });
          });
    });
	});
};

module.exports = UnzipsfxPlugin;
