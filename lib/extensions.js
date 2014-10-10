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
	path = require('path'),
	npm = require('npm'),
	Utilities = require('periodicjs.core.utilities'),
	CoreUtilities,
	extensionFilePath,
	extensionSkipModifyConf,
	extensionDirName;
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
var Extensions = function (appsettings) {
	var extensionsConfig = {},
		extensionsFiles = [];
	CoreUtilities = new Utilities({settings:appsettings});
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
	 * load extension config file: content/extensions/extensions.json
	 * @throws {Error} If missing config file
	 */
	this.init = function (appsettings) {
		extensionSkipModifyConf = typeof process.env.npm_config_skip_install_periodic_ext ==='string' || typeof process.env.npm_config_skip_ext_conf ==='string';
		/** 
		 * @description if passing dirname of extension, load the config file relative to that dirname
		 */
		if(typeof appsettings !=='undefined' && typeof appsettings.dirname !== 'undefined'){
			extensionDirName = appsettings.dirname;
			extensionFilePath =  path.resolve(extensionDirName,'../../content/extensions/extensions.json');
		}
		/**
		 * @description define extension file path to use
		 */
		else if(typeof appsettings !=='undefined' && typeof appsettings.extensionFilePath !== 'undefined'){
			extensionFilePath = appsettings.extensionFilePath;
		}
		/**
		 * @description this is the default extension config file path
		 */
		else{
			extensionFilePath = path.join(path.resolve(process.cwd(), './content/extensions/'), 'extensions.json');
		}
		/**
		 * @description use the existing config file without modifying it
		 */
		if(extensionSkipModifyConf!==true || appsettings.skipconffile !==true){
			extensionsConfig = fs.readJSONSync(extensionFilePath);
		}
		/**
		 * @description set array of compatible extensions if the semver is compatible, only set this array if loading extension core to add extension routes to express
		 */
		if(typeof appsettings !=='undefined' && typeof appsettings.version !== 'undefined'){
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
	var extdir = options.extdir,
		extpublicdir = options.extpublicdir;
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

Extensions.prototype.installConfigDirectory = function (options,callback) {
	var configdir = options.configdir,
		extconfigdir = options.extconfigdir;

	if(configdir && extconfigdir){
		fs.readdir(configdir, function (err) {
			// console.log("files",files);
			if (err || !extconfigdir) {
				callback(null,'No config files to copy');
			}
			else {
				//make destination dir
				fs.mkdirs(extconfigdir, function (err) {
					if (err) {
						callback(err,null);
					}
					else {
						fs.copy(configdir, extconfigdir, function (err) {
							if (err) {
								callback(err,null);
							}
							else {
								callback(null,'Copied config files');
							}
						});
					}
				});
			}
		});
	}
	else{
		callback(null,'No config files to copy');
	}
};

Extensions.prototype.setExtConf = function (options,callback) {
	var logfile = options.logfile,
		// extname = options.extname,
		extpackfile = options.extpackfile,
		extconffile = options.extconffile,
		enabledstatus = (options.enabled) ? options.enabled : false,
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
					'enabled': enabledstatus,
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

/**
 * Returns the position in array of extensions and data of extension in the extension configuration json file
 * @param  {object} options contains, extname name to look up, array of extensions from the extension file
 * @return {object}         selectedExt - ext json data,err - error in finding ext in conf,numX - index of ext in conf
 */
Extensions.prototype.getCurrentExt = function (options) {
	var extname = options.extname,
		currentExtensions = options.currentextconf.extensions,
		z = false,
		err,
		selectedExt;

	for (var x in currentExtensions) {
		if (currentExtensions[x].name === extname) {
			z = x;
		}
	}

	if (z !== false) {
		selectedExt = currentExtensions[z];
	}
	else{
		err = new Error('selected ext('+extname+') is not in the current configuration');
	}

	return {
		selectedExt: selectedExt,
		err: err,
		numX: z
	};
};

/**
 * remove an extensions public files
 * @param  {object}   options  contains path to ext files in public directory
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,status)
 */
Extensions.prototype.removePublicFiles = function(options,callback){
	var publicDir = options.publicdir;
	if(publicDir){
		fs.remove(publicDir, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null,'removed public directory');
			}
		});
	}
	else{
		callback(null,'no public directory to remove');
	}
};

/**
 * remove an extensions config files
 * @param  {object}   options contains path to ext files in content/config directory
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,status)
 */
Extensions.prototype.removeConfigFiles = function(options,callback){
	var configDir = options.configdir;
	if(configDir){
		fs.remove(configDir, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null,'removed config directory');
			}
		});
	}
	else{
		callback(null,'no conf directory to remove');
	}
};

/**
 * remove extension from extensions.json
 * @param  {object}   options  extname,currentExtensionsConfJson
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,status)
 */
Extensions.prototype.removeExtFromConf = function (options,callback) {
	var extname = options.extname,
		currentExtensionsConf = options.currentExtensionsConfJson,
		selectedExtObj = this.getCurrentExt({
			extname: extname,
			currentextconf: currentExtensionsConf
		}),
		numX = selectedExtObj.numX;
	
	if(selectedExtObj.err){
		callback(null,{
			message: extname + ' error in extensions.json: '+selectedExtObj.err+', application restarting \r\n  ====##REMOVED-END##===='
		});
	}
	else if(numX){
		currentExtensionsConf.extensions.splice(numX, 1);
		fs.outputJson(
			this.getExtensionConfFilePath(),
			currentExtensionsConf,
			function (err) {
				if (err) {
					callback(err, null);
				}
				else {
					callback(null,{
						message: extname + ' removed, extensions.conf updated, application restarting \r\n  ====##REMOVED-END##===='
					});
				}
			}
		);
	}
	else{
		callback(null,{
			message: extname + ' was not found in extensions.conf updated, application restarting \r\n  ====##REMOVED-END##===='
		});
	}
};

Extensions.prototype.enableExtension = function (options, callback) {
	var selectedExtObj = {
			selectedExt: options.extension,
			numX: options.extensionx
		},
		selectedExt = selectedExtObj.selectedExt,
		numX = selectedExtObj.numX,
		selectedExtDeps = selectedExt.periodicConfig.periodicDependencies,
		numSelectedExtDeps = selectedExtDeps.length,
		confirmedDeps = [],
		appSettings=options.appSettings;

	selectedExt.enabled = true;
	appSettings.extconf.extensions = options.extensions;

	try {
		if (!semver.lte(
			selectedExt.periodicCompatibility, appSettings.version)) {
			callback(new Error('This extension requires periodic version: ' + selectedExt.periodicCompatibility + ' not: ' + appSettings.version),null);
		}
		else {
			for (var x in selectedExtDeps) {
				var checkDep = selectedExtDeps[x];
				for (var y in appSettings.extconf.extensions) {
					var checkExt = appSettings.extconf.extensions[y];
					if (checkDep.extname === checkExt.name && checkExt.enabled) {
						confirmedDeps.push(checkExt.name);
					}
				}
			}
			if (numSelectedExtDeps === confirmedDeps.length) {
				appSettings.extconf.extensions[numX].enabled = true;

				fs.outputJson(
					this.getExtensionConfFilePath(),
					appSettings.extconf,
					function (err) {
						if (err) {
							callback(err,null);
						}
						else {
							callback(null,'extension enabled');
						}
					}
				);
			}
			else {
				callback(new Error('Missing ' + (numSelectedExtDeps - confirmedDeps.length) + ' enabled extensions.'),null);
			}
		}
	}
	catch (e) {
		callback(e,null);
	}
};

Extensions.prototype.disableExtension = function (options, callback) {
	var selectedExtObj = {
			selectedExt: options.extension,
			numX: options.extensionx
		},
		// selectedExt = selectedExtObj.selectedExt,
		numX = selectedExtObj.numX,
		appSettings=options.appSettings;

	appSettings.extconf.extensions[numX].enabled = false;

	try {
		fs.outputJson(
			this.getExtensionConfFilePath(),
			appSettings.extconf,
			function (err) {
				if (err) {
					callback(err,null);
				}
				else {
					callback(null,'extension disabled');
				}
			}
		);
	}
	catch (e) {
		callback(e,null);
	}
};

Extensions.prototype.getconfigdir = function (options) {
	return path.resolve(process.cwd(), 'content/config/extensions/',options.extname);
};

Extensions.prototype.extFunctions = function() {
	return{
		getlogfile : function (options) {
			var installfileprefix = (options.installprefix) ? options.installprefix : 'install-ext.',
				extfilename = (options.extfilename) ? options.extfilename : CoreUtilities.makeNiceName(options.reponame);  

			return path.join(options.logdir, installfileprefix + options.userid + '.' + extfilename + '.' + options.timestamp + '.log');
		},
		getrepourl : function (options) {
			return (options.repoversion === 'latest' || !options.repoversion) ?
				'https://github.com/' + options.reponame + '/archive/master.tar.gz' :
				'https://github.com/' + options.reponame + '/tarball/' + options.repoversion;
		},
		getlogdir : function () {
			return path.resolve(process.cwd(), 'content/extensions/log/');
		},
		getextdir : function () {
			return path.join(process.cwd(), './node_modules');
		},
		getconfigdir : function (options) {
			return path.resolve(process.cwd(), 'config/extensions/',options.extname);
		}
	};
};

Extensions.prototype.uninstall_viaNPM = function (options,callback) {
	var extname = options.extname;

	npm.load({
			'strict-ssl': false,
			'production': true
			// prefix: extdir
		},
		function (err) {
			if (err) {
				callback(err,null);
			}
			else {
				npm.commands.uninstall([extname], function (err, data) {
					if (err) {
						callback(err,null);
					}
					else {
						callback(null,data);
					}
				});
				npm.on('log', function (message) {
					console.log(message);
				});
			}
	});
};

/***/
Extensions.prototype.moveExtensionBefore = function(options,callback){
	var extname = options.extname,
		movebefore = options.movebefore,
		indexofext = false,
		extobj = false,
		indexofmovebefore = false,
		currentExtensionsConfFileJson,
		newExtensionConfToSave = {};

	this.getExtensions({},function(err,currentExtensionsConf){
		if(err){
			callback(err,null);
		}
		else{
			currentExtensionsConfFileJson = currentExtensionsConf;
			for(var i in currentExtensionsConf){
				if(currentExtensionsConf[i].name === extname){
					indexofext = i;
				}
				if(currentExtensionsConf[i].name === movebefore){
					indexofmovebefore = i;
				}
			}
			if(indexofmovebefore===false || indexofext === false){
				callback(new Error('trying to move extensions that are not in configuration'),null);
			}
			else{
				// console.log('indexofmovebefore',indexofmovebefore,'indexofext',indexofext);
				extobj = currentExtensionsConf.splice(indexofext, 1)[0];
				currentExtensionsConf.splice(indexofmovebefore,0,extobj);
				// console.log('currentExtensionsConf',currentExtensionsConf);

				newExtensionConfToSave.extensions = currentExtensionsConf;
				fs.outputJson(this.getExtensionConfFilePath(), newExtensionConfToSave, function (err) {
					if (err) {
						callback(err,null);
					}
					else {
						callback(null,{
							message: 'successfully moved extenion',
							updatedExtensions: newExtensionConfToSave.extensions
						});
					}
				});
			}
		}
	}.bind(this));
};

/**
 * installs extension files to public directory, content directory and inserts into extenions.json
 * @param  {object}   options  dirname
 * @param  {Function} callback async callback
 * @return {Function}            callback(err,results)
 */
Extensions.prototype.install = function(options,callback){
	var dirname = options.dirname || extensionDirName,
		skipconffile = typeof process.env.npm_config_skip_install_periodic_ext ==='string' || typeof process.env.npm_config_skip_ext_conf ==='string',
		enableOnInstall = typeof process.env.npm_config_enable_ext ==='string',
		packagejsonFileJSON = fs.readJSONSync(path.resolve(dirname,'./package.json')),
		extname = options.extname || packagejsonFileJSON.name,
		extdir = path.resolve( dirname,'./public'),
		configdir = path.resolve( dirname,'./config'),
		extpublicdir = path.resolve(dirname,'../../public/extensions/', extname),
		extconfigdir = path.resolve(dirname,'../../content/config/extensions/', extname),
		extpackfile = path.resolve(dirname,'./package.json'),
		extconffile = path.resolve(dirname,'./periodicjs.ext.json'),
		movebefore = options.movebefore,
		enabled = options.enabled || enableOnInstall;

	async.series({
		installExtPublicDirectory: function(asynccallback){
			this.installPublicDirectory({
				extname: extname,
				extdir : extdir,
				extpublicdir : extpublicdir
			},asynccallback);
		}.bind(this),
		installExtConfigDirectory: function(asynccallback){
			this.installConfigDirectory({
				extname: extname,
				configdir : configdir,
				extconfigdir : extconfigdir
			},asynccallback);
		}.bind(this),
		installExtSetPeriodicConf: function(asynccallback){
			if(skipconffile){
				asynccallback(null,'skipping extension conf file');
			}
			else{
				this.setExtConf({
					extname:extname,
					extpackfile:extpackfile,
					extconffile:extconffile,
					enabled:enabled,
				},asynccallback);
			}
		}.bind(this)
	},function(err,results){
		if(err){
			callback(err,null);
		}
		else if(skipconffile){
			callback(null,'skipping extension conf file and installed extension');
		}
		else{
			// console.log(results.installExtPublicDirectory);
			this.updateExtConfFile(results.installExtSetPeriodicConf,
				function(err,status){
					if(err){
						callback(err,null);
					}
					else{
						if(movebefore){
							this.moveExtensionBefore({
								extname:extname,
								movebefore:movebefore
							},
							function(err,movestatus){
									if(err){
										callback(err,null);
									}
									else{
										callback(null,movestatus.message+' - '+status.message);
									}
							});
						}
						else{
							callback(null,status.message);
						}
					}
				}.bind(this));
		}
	}.bind(this));
};

/**
 * removes extension files from public directory, content directory and from extenions.json
 * @param  {object}   options  dirname,removepublicdir,removeconfigdir
 * @param  {Function} callback async callback
 * @return {Function}            callback(err,results)
 */
Extensions.prototype.uninstall = function(options,callback){
	// console.log('process.env',process.env);
	var dirname = options.dirname || extensionDirName, 
		packagejsonFileJSON = fs.readJSONSync(path.resolve(dirname,'./package.json')),
		extname = options.extname || packagejsonFileJSON.name,
		extpublicdir = (options.removepublicdir)? path.resolve(__dirname,'../../public/extensions/', extname) : null,
		extconfigdir = (options.removeconfigdir)? path.resolve(__dirname,'../../content/config/extensions/', extname) : null,
		extensionFileJson = fs.readJSONSync(extensionFilePath);

	async.series({
		removeExtPublicDirectory: function(callback){
			this.removePublicFiles({
				publicdir : extpublicdir
			},callback);
		}.bind(this),
		removeExtConfigDirectory: function(callback){
			this.removeConfigFiles({
				configdir : extconfigdir
			},callback);
		}.bind(this),
		removeExtFromPeriodicConf: function(callback){
			this.removeExtFromConf({
				extname : extname,
				currentExtensionsConfJson : extensionFileJson
			},callback);
		}.bind(this)
	},function(err,results){
		if(err){
			callback(err,null);
		}
		else{
			callback(null,results);
		}
	}.bind(this));
};

module.exports = Extensions;