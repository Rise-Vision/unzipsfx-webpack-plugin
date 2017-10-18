'use strict';

const path = require('path');
const fs = require('fs');
const RawSource = require('webpack-sources').RawSource;


function UnzipsfxPlugin(options) {
	this.options = options || {};
}

function getData(srcPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(srcPath, (err, data) => {
      if (err) reject(err);
      return resolve(data);
    });
  });
}

function getPath(compilation, outputPath, outputFilename, extension) {
  let outputPathAndFilename = path.resolve(
    compilation.options.output.path,
    outputPath,
    outputFilename + extension
  );

  let relativeOutputPath = path.relative(
    compilation.options.output.path,
    outputPathAndFilename
  );

  return relativeOutputPath;
}

UnzipsfxPlugin.prototype.apply = function(compiler) {
  const options = this.options;
	compiler.plugin('emit', function(compilation, callback) {
		if (this.isChild()) {
			callback();
			return;
		}
    const outputPath = options.outputPath || compilation.options.output.path;
    const outputFilename = options.outputFilename || compilation.options.output.filename || path.basename(outputPath);
    const zipFilePath = getPath(compilation, outputPath, outputFilename, ".zip");

    getData(__dirname + "/lnx-32/unzipsfx").then((data)=>{
      let linuxBuffer = Buffer.concat([data, compilation.assets[zipFilePath].source()]);
      compilation.assets[getPath(compilation, outputPath, outputFilename + "-lnx-32", ".sh")] = new RawSource(linuxBuffer);

      getData(__dirname + "/lnx-64/unzipsfx").then((data)=>{
        let linuxBuffer = Buffer.concat([data, compilation.assets[zipFilePath].source()]);
        compilation.assets[getPath(compilation, outputPath, outputFilename + "-lnx-64", ".sh")] = new RawSource(linuxBuffer);

        getData(__dirname + "/lnx-armv7l/unzipsfx").then((data)=>{
          let linuxBuffer = Buffer.concat([data, compilation.assets[zipFilePath].source()]);
          compilation.assets[getPath(compilation, outputPath, outputFilename + "-lnx-armv7l", ".sh")] = new RawSource(linuxBuffer);

          getData(__dirname + "/win/unzipsfx.exe").then((data)=>{
            let windowsBuffer = Buffer.concat([data, compilation.assets[zipFilePath].source()]);
            compilation.assets[getPath(compilation, outputPath, outputFilename, ".exe")] = new RawSource(windowsBuffer);
            callback();
          });
        });


      });


    });
	});
};

module.exports = UnzipsfxPlugin;
