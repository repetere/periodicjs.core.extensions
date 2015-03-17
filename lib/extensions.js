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
 * @constructor
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:fs
 * @requires module:util-extent
 * @throws {Error} If missing configuration files
 * @todo to do later
 */
var Extensions = function (appsettings) {
	var extensionsConfig = {},
		extensionsFiles = [];
	CoreUtilities = new Utilities({
		settings: appsettings
	});
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

	/**
	 * require extension files from config based on enabled status and compatibilty version, also ignore and extension and return index of ignored extension. This is used to ignore default routes and load them last if enabled.
	 * @param  {object} obj periodic resources object
	 * @return {number}     index of ignored extension
	 */
	this.loadExtensions = function (obj) {
		try{
			extensionsFiles.forEach(function (file,index) {
				if(obj.ignoreExtension){
					if(file.search(obj.ignoreExtension)===-1){
						obj = require(file)(obj);
					}
					else{
						obj.ignoreExtensionIndex = index;
					}
				}
				else{
					obj = require(file)(obj);				
				}
				if(!obj){
					throw new Error('Extension: '+file+', does not return periodic obj');
				}
			});

			return obj;
		}
		catch(e){
			throw new Error(e);
		}
	};

	/**
	 * load a route and return periodic object
	 * @param  {string} file extension file
	 * @param  {object} obj  periodic object
	 * @return {object}      periodic object
	 */
	this.loadExtensionRoute = function(file,obj){
		try{
			obj = require(file)(obj);				
			if(!obj){
				throw new Error('Extension: '+file+', does not return periodic obj');
			}
			return obj;
		}
		catch(e){
			throw new Error(e);
		}
	};

	/** 
	 * load extension config file: content/config/extensions.json
	 * @throws {Error} If missing config file
	 */
	this.init = function (appsettings) {
		extensionSkipModifyConf = typeof process.env.npm_config_skip_install_periodic_ext === 'string' || typeof process.env.npm_config_skip_ext_conf === 'string';
		/** 
		 * @description if passing dirname of extension, load the config file relative to that dirname
		 */
		if (typeof appsettings !== 'undefined' && typeof appsettings.dirname !== 'undefined') {
			extensionDirName = appsettings.dirname;
			if(extensionDirName.match('periodicjs/node_modules/@')){
				console.log('Private NPM Modules');
				extensionFilePath = path.resolve(extensionDirName, '../../../content/config/extensions.json');
			}
			else{
				extensionFilePath = path.resolve(extensionDirName, '../../content/config/extensions.json');				
			}
		}
		/**
		 * @description define extension file path to use
		 */
		else if (typeof appsettings !== 'undefined' && typeof appsettings.extensionFilePath !== 'undefined') {
			extensionFilePath = appsettings.extensionFilePath;
		}
		/**
		 * @description this is the default extension config file path
		 */
		else {
			extensionFilePath = path.join(path.resolve(process.cwd(), './content/config/'), 'extensions.json');
		}
		/**
		 * @description use the existing config file without modifying it
		 */
		if (extensionSkipModifyConf !== true || appsettings.skipconffile !== true) {
			extensionsConfig = fs.readJSONSync(extensionFilePath);
		}
		/**
		 * @description set array of compatible extensions if the semver is compatible, only set this array if loading extension core to add extension routes to express
		 */
		if (typeof appsettings !== 'undefined' && typeof appsettings.version !== 'undefined') {
			extensionsConfig.extensions.forEach(function (val) {
				try {
					if (semver.lte(val.periodicCompatibility, appsettings.version) && val.enabled) {

						if(val.name.match('@')){
							val.name = val.name;
						}
						else if(val.name.match('/')){
							val.name = val.name.split('/')[1];
						}

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

Extensions.prototype.getExtensionConfFilePath = function () {
	return extensionFilePath;
};

Extensions.prototype.getExtensions = function (options, callback) {
	fs.readJson(extensionFilePath, function (err, extJson) {
		if (err) {
			callback(err, null);
		}
		else {
			callback(null, extJson.extensions);
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

Extensions.prototype.installPublicDirectory = function (options, callback) {
	var extdir = options.extdir,
		extpublicdir = options.extpublicdir;
	// console.log("extname",extname);
	// fs.readdir(extdir, function (err, files) {
	fs.readdir(extdir, function (err) {
		// console.log("files",files);
		if (err) {
			callback(null, 'No public files to copy');
		}
		else {
			//make destination dir
			fs.mkdirs(extpublicdir, function (err) {
				if (err) {
					callback(err, null);
				}
				else {
					fs.copy(extdir, extpublicdir, function (err) {
						if (err) {
							callback(err, null);
						}
						else {
							callback(null, 'Copied public files');
						}
					});
				}
			});
		}
	});
};

/**
 * get both installed files, and the default files in ext conf directory, if missin files, add them to missing conf files array
 * @param {object} options ext_default_config_file_path - ext conf files,ext_installed_config_file_path - destination for ext conf files
 * @param  {Function} callback async.parallel callback
 * @return {Array}            array of missing conf files
 */
Extensions.prototype.getExtensionConfigFiles = function (options, callback) {
	var ext_default_config_file_path = options.ext_default_config_file_path,
		ext_installed_config_file_path = options.ext_installed_config_file_path,
		missing_conf_files = [],
		installed_conf_files = [];

	async.parallel({
			defaultExtConfFiles: function (cb) {
				fs.readdir(ext_default_config_file_path, function (err, files) {
					cb(null, files);
				});
			},
			installedExtConfFiles: function (cb) {
				fs.readdir(ext_installed_config_file_path, function (err, files) {
					cb(null, files);
				});
			}
		},
		function (err, result) {
			try {
				if (result.defaultExtConfFiles && result.defaultExtConfFiles.length > 0) {
					missing_conf_files = result.defaultExtConfFiles;
					if (result.installedExtConfFiles && result.installedExtConfFiles.length > 0) {
						for (var c in missing_conf_files) {
							for (var d in result.installedExtConfFiles) {
								if (missing_conf_files[c] === result.installedExtConfFiles[d]) {
									installed_conf_files.push(missing_conf_files.splice(c, 1)[0]);
								}
							}
						}
					}
				}
				callback(null, {
					ext_default_config_file_path: ext_default_config_file_path,
					ext_installed_config_file_path: ext_installed_config_file_path,
					missingExtConfFiles: missing_conf_files
				});
			}
			catch (e) {
				callback(e, null);
			}
		});
};

/**
 * copy missing files if any are missing
 * @param {object} options ext_default_config_file_path - ext conf files,ext_installed_config_file_path - destination for ext conf files,missingExtConfFiles array of missing files
 * @param  {Function} callback            async callback
 */
Extensions.prototype.copyMissingConfigFiles = function (options, callback) {
	var ext_default_config_file_path = options.ext_default_config_file_path,
		ext_installed_config_file_path = options.ext_installed_config_file_path,
		missingExtConfFiles = options.missingExtConfFiles;
	if (missingExtConfFiles && missingExtConfFiles.length > 0) {
		async.each(missingExtConfFiles, function (file, cb) {
			fs.copy(path.resolve(ext_default_config_file_path, file), path.resolve(ext_installed_config_file_path, file), cb);
		}, function (err) {
			callback(err);
		});
	}
	else {
		callback(null);
	}
};

/**
 * copy extension config files if they don't exist
 * @param  {object}   options  configdir - default config files, extconfigdir - install directory of config files
 * @param  {Function} callback async callback
 * @return {Function}            async callback
 */
Extensions.prototype.installConfigDirectory = function (options, callback) {
	var defaultconfigdir = options.configdir,
		installextconfigdir = options.extconfigdir;

	if (defaultconfigdir && installextconfigdir) {

		fs.mkdirs(installextconfigdir, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				async.waterfall([
						function (cb) {
							cb(null, {
								ext_default_config_file_path: defaultconfigdir,
								ext_installed_config_file_path: installextconfigdir
							});
						},
						this.getExtensionConfigFiles,
						this.copyMissingConfigFiles
					],
					function (err) {
						if (err) {
							callback(err, null);
						}
						else {
							callback(null, 'Copied config files');
						}
					}.bind(this));
			}
		}.bind(this));
	}
	else {
		callback(null, 'No config files to copy');
	}
};

/**
 * set the extension JSON to be appended to extensions.json
 * @param {object}   options  logfile,extpackfile - package.json for ext, extconffile - periodicjs.ext.json, enabled - set the enabled status
 * @param {Function} callback async callback
 * @returns {Function} async callback
 */
Extensions.prototype.setExtConf = function (options, callback) {
	var logfile = options.logfile,
		// extname = options.extname,
		extpackfile = options.extpackfile,
		extconffile = options.extconffile,
		enabledstatus = (typeof options.enabled === 'boolean') ? options.enabled : false,
		extpackfileJSON = {};

	this.getExtensions({}, function (err, currentExtensionsConf) {
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
				callback(err, null);
			}
			else {
				//if in current conf, keep enable status
				var extInCurrentConfFile;
				for(var s in currentExtensionsConf){
					// console.log('results.packfile.name',results.packfile.name);
					// console.log('currentExtensionsConf[s].name',currentExtensionsConf[s].name);
					if(currentExtensionsConf[s].name.match('/') && currentExtensionsConf[s].name.split('/')[1]===results.packfile.name){
						// console.log('has / in name for currentExtensionsConf[s].name',currentExtensionsConf[s].name,results.packfile.name);
						extInCurrentConfFile=currentExtensionsConf[s];
						enabledstatus = (enabledstatus===true && extInCurrentConfFile.enabled ===true) ? true : extInCurrentConfFile.enabled;
						results.packfile.name = currentExtensionsConf[s].name;
					}
					else if(results.packfile.name === currentExtensionsConf[s].name){
						extInCurrentConfFile=currentExtensionsConf[s];
						enabledstatus = (enabledstatus===true && extInCurrentConfFile.enabled ===true) ? true : extInCurrentConfFile.enabled;
					}
				}
				// console.log('currentExtensionsConf',currentExtensionsConf);
				extpackfileJSON = {
					'name': results.packfile.name,
					'version': results.packfile.version,
					'periodicCompatibility': results.conffile.periodicCompatibility,
					'installed': true,
					'enabled': enabledstatus,
					'date': new Date(),
					'periodicConfig': results.conffile
				};

				callback(null, {
					currentExtensions: currentExtensionsConf,
					extToAdd: extpackfileJSON,
					logfile: logfile,
					cli: options.cli
				});
			}
		});
	});
};

/**
 * updates extensions.json with extToAdd
 * @param  {object}   options  currentExtensions - current ext conf, extToAdd - extension to add
 * @param  {Function} callback async callback
 * @return {Function}            async callback
 */
Extensions.prototype.updateExtConfFile = function (options, callback) {
	var currentExtConfSettings = {},
		currentExtensions = options.currentExtensions,
		extToAdd = options.extToAdd;
	currentExtConfSettings.extensions = [];

	if (!extToAdd.name) {
		callback('extension conf doesn\'t have a valid name', null);
	}
	else if (!semver.valid(extToAdd.version)) {
		callback('extension conf doesn\'t have a valid semver', null);
	}
	else if (!semver.valid(extToAdd.periodicConfig.periodicCompatibility)) {
		callback('extension conf doesn\'t have a valid periodic semver', null);
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
			currentExtensions[extIndex] = extToAdd;
		}
		else {
			currentExtensions.push(extToAdd);
		}
		currentExtConfSettings.extensions = currentExtensions;

		fs.outputJson(this.getExtensionConfFilePath(), currentExtConfSettings, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, {
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
	else {
		err = new Error('selected ext(' + extname + ') is not in the current configuration');
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
Extensions.prototype.removePublicFiles = function (options, callback) {
	var publicDir = options.publicdir;
	if (publicDir) {
		fs.remove(publicDir, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, 'removed public directory');
			}
		});
	}
	else {
		callback(null, 'no public directory to remove');
	}
};

/**
 * remove an extensions config files
 * @param  {object}   options contains path to ext files in content/config directory
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,status)
 */
Extensions.prototype.removeConfigFiles = function (options, callback) {
	var configDir = options.configdir;
	if (configDir) {
		fs.remove(configDir, function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				callback(null, 'removed config directory');
			}
		});
	}
	else {
		callback(null, 'no conf directory to remove');
	}
};

/**
 * remove extension from extensions.json
 * @param  {object}   options  extname,currentExtensionsConfJson
 * @param  {Function} callback async callback
 * @return {Function}            async callback(err,status)
 */
Extensions.prototype.removeExtFromConf = function (options, callback) {
	var extname = options.extname,
		currentExtensionsConf = options.currentExtensionsConfJson,
		selectedExtObj = this.getCurrentExt({
			extname: extname,
			currentextconf: currentExtensionsConf
		}),
		numX = selectedExtObj.numX;

	if (selectedExtObj.err) {
		callback(null, {
			message: extname + ' error in extensions.json: ' + selectedExtObj.err + ', application restarting \r\n  ====##REMOVED-END##===='
		});
	}
	else if (numX) {
		currentExtensionsConf.extensions.splice(numX, 1);
		fs.outputJson(
			this.getExtensionConfFilePath(),
			currentExtensionsConf,
			function (err) {
				if (err) {
					callback(err, null);
				}
				else {
					callback(null, {
						message: extname + ' removed, extensions.conf updated, application restarting \r\n  ====##REMOVED-END##===='
					});
				}
			}
		);
	}
	else {
		callback(null, {
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
		appSettings = options.appSettings;

	selectedExt.enabled = true;
	appSettings.extconf.extensions = options.extensions;

	try {
		if (!semver.lte(
				selectedExt.periodicCompatibility, appSettings.version)) {
			callback(new Error('This extension requires periodic version: ' + selectedExt.periodicCompatibility + ' not: ' + appSettings.version), null);
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
							callback(err, null);
						}
						else {
							callback(null, 'extension enabled');
						}
					}
				);
			}
			else {
				callback(new Error('Missing ' + (numSelectedExtDeps - confirmedDeps.length) + ' enabled extensions.'), null);
			}
		}
	}
	catch (e) {
		callback(e, null);
	}
};

Extensions.prototype.disableExtension = function (options, callback) {
	var selectedExtObj = {
			selectedExt: options.extension,
			numX: options.extensionx
		},
		// selectedExt = selectedExtObj.selectedExt,
		numX = selectedExtObj.numX,
		appSettings = options.appSettings;

	appSettings.extconf.extensions[numX].enabled = false;

	try {
		fs.outputJson(
			this.getExtensionConfFilePath(),
			appSettings.extconf,
			function (err) {
				if (err) {
					callback(err, null);
				}
				else {
					callback(null, 'extension disabled');
				}
			}
		);
	}
	catch (e) {
		callback(e, null);
	}
};

Extensions.prototype.getconfigdir = function (options) {
	return path.resolve(process.cwd(), 'content/config/extensions/', options.extname);
};

Extensions.prototype.extFunctions = function () {
	return {
		getlogfile: function (options) {
			var installfileprefix = (options.installprefix) ? options.installprefix : 'install-ext.',
				extfilename = (options.extfilename) ? options.extfilename : CoreUtilities.makeNiceName(options.reponame);

			return path.join(options.logdir, installfileprefix + options.userid + '.' + extfilename + '.' + options.timestamp + '.log');
		},
		getrepourl: function (options) {
			return (options.repoversion === 'latest' || !options.repoversion) ?
				'https://github.com/' + options.reponame + '/archive/master.tar.gz' :
				'https://github.com/' + options.reponame + '/tarball/' + options.repoversion;
		},
		getlogdir: function () {
			return path.resolve(process.cwd(), 'content/config/log/');
		},
		getextdir: function () {
			return path.join(process.cwd(), './node_modules');
		},
		getconfigdir: function (options) {
			return path.resolve(process.cwd(), 'config/extensions/', options.extname);
		}
	};
};

Extensions.prototype.uninstall_viaNPM = function (options, callback) {
	var extname = options.extname;

	npm.load({
			'strict-ssl': false,
			'production': true
				// prefix: extdir
		},
		function (err) {
			if (err) {
				callback(err, null);
			}
			else {
				npm.commands.uninstall([extname], function (err, data) {
					if (err) {
						callback(err, null);
					}
					else {
						callback(null, data);
					}
				});
				npm.on('log', function (message) {
					console.log(message);
				});
			}
		});
};

/**
 * move ext to before specified extension in extension.json extension array
 * @param  {object}   options  extname,movebefore - this is the name of the extension you want to move it before
 * @param  {Function} callback async callback
 * @return {Function}            async callback
 */
Extensions.prototype.moveExtensionBefore = function (options, callback) {
	var extname = options.extname,
		movebefore = options.movebefore,
		moveafter = options.moveafter,
		installatindex = options.installatindex,
		indexofext = false,
		extobj = false,
		indexofmovebefore = false,
		indexofmoveafter = false,
		currentExtensionsConfFileJson,
		newExtensionConfToSave = {};

	this.getExtensions({}, function (err, currentExtensionsConf) {
		if (err) {
			callback(err, null);
		}
		else {
			currentExtensionsConfFileJson = currentExtensionsConf;
			for (var i in currentExtensionsConf) {
				if (currentExtensionsConf[i].name === extname && indexofext === false) {
					indexofext = i;
				}
				if (currentExtensionsConf[i].name === movebefore && indexofmovebefore === false) {
					indexofmovebefore = i;
				}
				if (currentExtensionsConf[i].name === moveafter && indexofmoveafter === false) {
					indexofmoveafter = i;
				}
			}


			//	console.log('installatindex',installatindex,'indexofmoveafter',indexofmoveafter,'indexofmovebefore',indexofmovebefore,'indexofext',indexofext);
			//	console.log('typeof indexofmoveafter',typeof indexofmoveafter);
			if ((indexofext < indexofmovebefore) && (typeof installatindex !=='number')) {
				callback(null, {
					message: 'MOVE BEFORE WARN: Extension (' + currentExtensionsConf[indexofext].name + ') is already before (' + currentExtensionsConf[indexofmovebefore].name + ')'
				});
			}
			else if ((indexofext > parseInt(indexofmoveafter)) && (typeof installatindex !=='number')) {
				callback(null, {
					message: 'MOVE AFTER WARN: Extension (' + currentExtensionsConf[indexofext].name + ') is already after (' + currentExtensionsConf[indexofmoveafter].name + ')'
				});
			}
			else if ((indexofmovebefore === false || indexofext === false) && (indexofmoveafter === false || indexofext === false) && (typeof installatindex !=='number')) {
				callback(null, {
					message: 'MOVE BEFORE ERROR: trying to move extensions that are not in configuration'
				});
			}
			else {
				extobj = currentExtensionsConf.splice(indexofext, 1)[0];
				if (extobj.name === extname) {
					if(typeof installatindex ==='number'){
						installatindex = (installatindex < currentExtensionsConf.length) ? installatindex : currentExtensionsConf.length -1;
						currentExtensionsConf.splice(installatindex, 0, extobj);						
					}
					else if(indexofmoveafter !==false){
						currentExtensionsConf.splice((parseInt(indexofmoveafter)+1), 0, extobj);
					}
					else {
						currentExtensionsConf.splice(indexofmovebefore, 0, extobj);						
					}
					newExtensionConfToSave.extensions = currentExtensionsConf;
					fs.outputJson(this.getExtensionConfFilePath(), newExtensionConfToSave, function (err) {
						if (err) {
							callback(err, null);
						}
						else {
							callback(null, {
								message: 'successfully moved extensions',
								updatedExtensions: newExtensionConfToSave.extensions
							});
						}
					});
				}
				else {
					// console.log('currentExtensionsConf',currentExtensionsConf);
					callback(null, {
						message: 'MOVE BEFORE ERROR: INVALID EXTENSION CONFIG, MAY HAVE DUPLICATE EXTENSIONS'
					});
				}
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
Extensions.prototype.install = function (options, callback) {
	var dirname = options.dirname || extensionDirName,
		skipconffile = typeof process.env.npm_config_skip_install_periodic_ext === 'string' || typeof process.env.npm_config_skip_ext_conf === 'string',
		enableOnInstall = typeof process.env.npm_config_enable_ext === 'string',
		packagejsonFileJSON = fs.readJSONSync(path.resolve(dirname, './package.json')),
		extname = options.extname || packagejsonFileJSON.name,
		extdir = path.resolve(dirname, './public'),
		configdir = path.resolve(dirname, './config'),
		extpublicdir = path.resolve(dirname, '../../public/extensions/', extname),
		extconfigdir = path.resolve(dirname, '../../content/config/extensions/', extname),
		extpackfile = path.resolve(dirname, './package.json'),
		extconffile = path.resolve(dirname, './periodicjs.ext.json'),
		movebefore = options.movebefore,
		moveafter = options.moveafter,
		installatindex = options.installatindex,
		enabled = options.enabled || enableOnInstall;

	async.series({
		installExtPublicDirectory: function (asynccallback) {
			this.installPublicDirectory({
				extname: extname,
				extdir: extdir,
				extpublicdir: extpublicdir
			}, asynccallback);
		}.bind(this),
		installExtConfigDirectory: function (asynccallback) {
			this.installConfigDirectory({
				extname: extname,
				configdir: configdir,
				extconfigdir: extconfigdir
			}, asynccallback);
		}.bind(this),
		installExtSetPeriodicConf: function (asynccallback) {
			if (skipconffile) {
				asynccallback(null, 'skipping extension conf file');
			}
			else {
				this.setExtConf({
					extname: extname,
					extpackfile: extpackfile,
					extconffile: extconffile,
					enabled: enabled,
				}, asynccallback);
			}
		}.bind(this)
	}, function (err, results) {
		if (err) {
			callback(err, null);
		}
		else if (skipconffile) {
			callback(null, 'skipping extension conf file and installed extension');
		}
		else {
			// console.log(results.installExtPublicDirectory);
			this.updateExtConfFile(results.installExtSetPeriodicConf,
				function (err, status) {
					if (err) {
						callback(err, null);
					}
					else {
						if (movebefore || moveafter || typeof installatindex==='number') {
							this.moveExtensionBefore({
									extname: extname,
									movebefore: movebefore,
									moveafter: moveafter,
									installatindex: installatindex
								},
								function (err, movestatus) {
									if (err) {
										callback(err, null);
									}
									else {
										callback(null, movestatus.message + ' - ' + status.message);
									}
								});
						}
						else {
							callback(null, status.message);
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
Extensions.prototype.uninstall = function (options, callback) {
	// console.log('process.env',process.env);
	var dirname = options.dirname || extensionDirName,
		packagejsonFileJSON = fs.readJSONSync(path.resolve(dirname, './package.json')),
		extname = options.extname || packagejsonFileJSON.name,
		extpublicdir = (options.removepublicdir) ? path.resolve(__dirname, '../../public/extensions/', extname) : null,
		extconfigdir = (options.removeconfigdir) ? path.resolve(__dirname, '../../content/config/extensions/', extname) : null,
		extensionFileJson = fs.readJSONSync(extensionFilePath);

	async.series({
		removeExtPublicDirectory: function (callback) {
			this.removePublicFiles({
				publicdir: extpublicdir
			}, callback);
		}.bind(this),
		removeExtConfigDirectory: function (callback) {
			this.removeConfigFiles({
				configdir: extconfigdir
			}, callback);
		}.bind(this),
		removeExtFromPeriodicConf: function (callback) {
			this.removeExtFromConf({
				extname: extname,
				currentExtensionsConfJson: extensionFileJson
			}, callback);
		}.bind(this)
	}, function (err, results) {
		if (err) {
			callback(err, null);
		}
		else {
			callback(null, results);
		}
	}.bind(this));
};

module.exports = Extensions;
