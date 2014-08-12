/*
 * periodic
 * http://github.com/typesettin/periodic
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';

var fs = require('fs-extra'),
	async = require('async'),
	semver = require('semver'),
	path = require('path');
/**
 * A module that represents a extension manager.
 * @{@link https://github.com/typesettin/periodic}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @module config
 * @requires module:fs
 * @requires module:util-extent
 * @throws {Error} If missing configuration files
 * @todo to do later
 */
var extensionFilePath = path.join(path.resolve(process.cwd(), './content/extensions/'), 'extensions.json');

var Extensions = function (appsettings) {
	var extensionsConfig = {},
		extensionsFiles = [];

	/** 
	 * gets the configuration information
	 * @return { string } file path for config file
	 */
	this.settings = function () {
		return extensionsConfig;
	};

	this.files = function () {
		return extensionsFiles;
	};

	this.savePluginConfig = function (name, value) {
		this[name] = value;
	}.bind(this);

	this.loadExtensions = function (obj) {
		extensionsFiles.forEach(function (file) {
			require(file)(obj);
		});
	};

	/** 
	 * loads app configuration
	 * @throws {Error} If missing config file
	 */
	this.init = function (appsettings) {
		// /** load pluginfile: content/plugin/extensions.json */

		if(appsettings.extensionFilePath){
			extensionFilePath = appsettings.extensionFilePath;
		}
		extensionsConfig = fs.readJSONSync(appsettings.extensionFilePath || extensionFilePath);
		if(appsettings.version){
			extensionsConfig.extensions.forEach(function (val) {
				try {
					if (semver.lte(val.periodicCompatibility, appsettings.version) && val.enabled) {
						extensionsFiles.push(this.getExtensionFilePath(val.name));
					}
				}
				catch (e) {
					console.error(e);
					throw new Error('Invalid Extension Configuration');
				}
			}.bind(this));
		}
	}.bind(this);

	this.init(appsettings);
};

Extensions.prototype.getExtensionConfFilePath = function(){
	return extensionFilePath;
};

Extensions.prototype.getExtensions = function(options,callback){
	fs.readJson(extensionFilePath,function(err,extJson){
		if(err){
			callback(err,null);
		}
		else{
			callback(null,extJson.extensions);
		}
	});
};

Extensions.prototype.getExtensionFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'index.js');
};

Extensions.prototype.getExtensionPeriodicConfFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'periodicjs.ext.json');
};

Extensions.prototype.getExtensionFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'index.js');
};

Extensions.prototype.getExtensionPackageJsonFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'package.json');
};

Extensions.prototype.getExtensionPeriodicConfFilePath = function (extensionName) {
	return path.join(path.resolve(process.cwd(), './node_modules/', extensionName), 'periodicjs.ext.json');
};

Extensions.prototype.installPublicDirectory = function (options,callback) {
	var extname = options.extname,
		extdir = path.resolve(process.cwd(), './node_modules/', extname, 'public'),
		extpublicdir = path.resolve(process.cwd(), './public/extensions/', extname);
	// console.log("extname",extname);
	// fs.readdir(extdir, function (err, files) {
	fs.readdir(extdir, function (err) {
		// console.log("files",files);
		if (err) {
			callback(null,'No public files to copy');
		}
		else {
			//make destination dir
			fs.mkdirs(extpublicdir, function (err) {
				if (err) {
					callback(err,null);
				}
				else {
					fs.copy(extdir, extpublicdir, function (err) {
						if (err) {
							callback(err,null);
						}
						else {
							callback(null,'Copied public files');
						}
					});
				}
			});
		}
	});
};

Extensions.prototype.setExtConf = function (options,callback) {
	var logfile = options.logfile,
		// extname = options.extname,
		extpackfile = options.extpackfile,
		extconffile = options.extconffile,
		extpackfileJSON = {};

	this.getExtensions({},function(err,currentExtensionsConf){
		async.parallel({
			packfile: function (callback) {
				fs.readJson(extpackfile, callback);
				// Extensions.readJSONFileAsync(extpackfile, callback);
			},
			conffile: function (callback) {
				fs.readJson(extconffile, callback);
				// Extensions.readJSONFileAsync(extconffile, callback);
			}
		}, function (err, results) {
			if (err) {
				callback(err,null);
			}
			else {
				extpackfileJSON = {
					'name': results.packfile.name,
					'version': results.packfile.version,
					'periodicCompatibility': results.conffile.periodicCompatibility,
					'installed': true,
					'enabled': false,
					'date': new Date(),
					'periodicConfig': results.conffile
				};

				callback(null,{
					currentExtensions: currentExtensionsConf,
					extToAdd: extpackfileJSON,
					logfile: logfile,
					cli: options.cli
				});
			}
		});
	});
};

Extensions.prototype.updateExtConfFile = function (options,callback) {
	var currentExtConfSettings = {},
		currentExtensions = options.currentExtensions,
		extToAdd = options.extToAdd;
	currentExtConfSettings.extensions = [];
	// console.log('------------','extension to add',extToAdd);

	if (!extToAdd.name) {
		callback('extension conf doesn\'t have a valid name',null);
	}
	else if (!semver.valid(extToAdd.version)) {
		callback('extension conf doesn\'t have a valid semver',null);
	}
	else if (!semver.valid(extToAdd.periodicConfig.periodicCompatibility)) {
		callback('extension conf doesn\'t have a valid periodic semver',null);
	}
	else {
		var alreadyInConf = false,
			extIndex;
		for (var x in currentExtensions) {
			if (currentExtensions[x].name === extToAdd.name) {
				alreadyInConf = true;
				extIndex = x;
			}
		}
		if (alreadyInConf) {
			currentExtensions[x] = extToAdd;
		}
		else {
			currentExtensions.push(extToAdd);
		}
		currentExtConfSettings.extensions = currentExtensions;

		fs.outputJson(this.getExtensionConfFilePath(), currentExtConfSettings, function (err) {
			if (err) {
				callback(err,null);
			}
			else {
				callback(null,{
					message: extToAdd.name + ' installed, extensions.conf updated \r\n  ====##END##====',
					updatedExtensions: currentExtConfSettings.extensions
				});
			}
		});
	}
};

module.exports = Extensions;