<a name="Extensions"></a>
#class: Extensions
**Members**

* [class: Extensions](#Extensions)
  * [new Extensions()](#new_Extensions)
  * [extensions.init](#Extensions#init)
  * [extensions.settings()](#Extensions#settings)
  * [extensions.getExtensionConfigFiles(options, callback)](#Extensions#getExtensionConfigFiles)
  * [extensions.copyMissingConfigFiles(options, callback)](#Extensions#copyMissingConfigFiles)
  * [extensions.installConfigDirectory(options, callback)](#Extensions#installConfigDirectory)
  * [extensions.setExtConf(options, callback)](#Extensions#setExtConf)
  * [extensions.updateExtConfFile(options, callback)](#Extensions#updateExtConfFile)
  * [extensions.getCurrentExt(options)](#Extensions#getCurrentExt)
  * [extensions.removePublicFiles(options, callback)](#Extensions#removePublicFiles)
  * [extensions.removeConfigFiles(options, callback)](#Extensions#removeConfigFiles)
  * [extensions.removeExtFromConf(options, callback)](#Extensions#removeExtFromConf)
  * [extensions.moveExtensionBefore(options, callback)](#Extensions#moveExtensionBefore)
  * [extensions.install(options, callback)](#Extensions#install)
  * [extensions.uninstall(options, callback)](#Extensions#uninstall)

<a name="new_Extensions"></a>
##new Extensions()
A module that represents a extension manager.

**Type**: `Error`  
**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="Extensions#init"></a>
##extensions.init
load extension config file: content/extensions/extensions.json

**Type**: `Error`  
<a name="Extensions#settings"></a>
##extensions.settings()
gets the configuration information

**Returns**: `string` - file path for config file  
<a name="Extensions#getExtensionConfigFiles"></a>
##extensions.getExtensionConfigFiles(options, callback)
get both installed files, and the default files in ext conf directory, if missin files, add them to missing conf files array

**Params**

- options `object` - ext_default_config_file_path - ext conf files,ext_installed_config_file_path - destination for ext conf files  
- callback `function` - async.parallel callback  

**Returns**: `Array` - array of missing conf files  
<a name="Extensions#copyMissingConfigFiles"></a>
##extensions.copyMissingConfigFiles(options, callback)
copy missing files if any are missing

**Params**

- options `object` - ext_default_config_file_path - ext conf files,ext_installed_config_file_path - destination for ext conf files,missingExtConfFiles array of missing files  
- callback `function` - async callback  

<a name="Extensions#installConfigDirectory"></a>
##extensions.installConfigDirectory(options, callback)
copy extension config files if they don't exist

**Params**

- options `object` - configdir - default config files, extconfigdir - install directory of config files  
- callback `function` - async callback  

**Returns**: `function` - async callback  
<a name="Extensions#setExtConf"></a>
##extensions.setExtConf(options, callback)
set the extension JSON to be appended to extensions.json

**Params**

- options `object` - logfile,extpackfile - package.json for ext, extconffile - periodicjs.ext.json, enabled - set the enabled status  
- callback `function` - async callback  

**Returns**: `function` - async callback  
<a name="Extensions#updateExtConfFile"></a>
##extensions.updateExtConfFile(options, callback)
updates extensions.json with extToAdd

**Params**

- options `object` - currentExtensions - current ext conf, extToAdd - extension to add  
- callback `function` - async callback  

**Returns**: `function` - async callback  
<a name="Extensions#getCurrentExt"></a>
##extensions.getCurrentExt(options)
Returns the position in array of extensions and data of extension in the extension configuration json file

**Params**

- options `object` - contains, extname name to look up, array of extensions from the extension file  

**Returns**: `object` - selectedExt - ext json data,err - error in finding ext in conf,numX - index of ext in conf  
<a name="Extensions#removePublicFiles"></a>
##extensions.removePublicFiles(options, callback)
remove an extensions public files

**Params**

- options `object` - contains path to ext files in public directory  
- callback `function` - async callback  

**Returns**: `function` - async callback(err,status)  
<a name="Extensions#removeConfigFiles"></a>
##extensions.removeConfigFiles(options, callback)
remove an extensions config files

**Params**

- options `object` - contains path to ext files in content/config directory  
- callback `function` - async callback  

**Returns**: `function` - async callback(err,status)  
<a name="Extensions#removeExtFromConf"></a>
##extensions.removeExtFromConf(options, callback)
remove extension from extensions.json

**Params**

- options `object` - extname,currentExtensionsConfJson  
- callback `function` - async callback  

**Returns**: `function` - async callback(err,status)  
<a name="Extensions#moveExtensionBefore"></a>
##extensions.moveExtensionBefore(options, callback)
move ext to before specified extension in extension.json extension array

**Params**

- options `object` - extname,movebefore - this is the name of the extension you want to move it before  
- callback `function` - async callback  

**Returns**: `function` - async callback  
<a name="Extensions#install"></a>
##extensions.install(options, callback)
installs extension files to public directory, content directory and inserts into extenions.json

**Params**

- options `object` - dirname  
- callback `function` - async callback  

**Returns**: `function` - callback(err,results)  
<a name="Extensions#uninstall"></a>
##extensions.uninstall(options, callback)
removes extension files from public directory, content directory and from extenions.json

**Params**

- options `object` - dirname,removepublicdir,removeconfigdir  
- callback `function` - async callback  

**Returns**: `function` - callback(err,results)  
