# periodicjs.core.extensions

Periodic's CoreExtension module, provides helpful methods for install, removing, configuring node modules that augment Periodic's default Express control flow.

Extensions are node modules that are loaded when an instance of periodic is instantiated.

A list of enabled,disabled and installed Extensions are located in `content/extensions/extensions.json`

 [API Documentation](https://github.com/typesettin/periodicjs.core.extensions/blob/master/doc/api.md)

## Installation

```
$ npm install periodicjs.core.extensions
```

This is a part of Periodic's core.

## Usage

### Installing extensions
*JavaScript*
```javascript
var Extensions = require('periodicjs.core.extensions'),
	ExtensionCore = new Extensions({
		dirname: __dirname 
	});

ExtensionCore.install(options,callback);
```

### Removing extensions
*JavaScript*
```javascript
var Extensions = require('periodicjs.core.extensions'),
	ExtensionCore = new Extensions({
		dirname: __dirname 
	});

ExtensionCore.uninstall(options,callback);
```

##API

```javascript
ExtensionCore.loadExtensions(periodic); //load extensions defined in content/extensions/extensions.json
```
##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```

##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation