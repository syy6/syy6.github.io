/*
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 *
 * CDM Bootstrap script for LOCAL TESTING only.
 *
 * In a development environment, this script serves as the root of the CDM
 * bootstrap. And it will load all CDM bootstrap modules and the SAPUI5 modules
 * each as a single requested resource (no preloads and no bundling).
 */
(function(){"use strict";var b,B=document.querySelector("script[src$=\"sap/ushell/bootstrap/appFinder.js\"]");if(!B){throw new Error("cdm.js: could not identify homepage bootstrap script tag!");}b=B.src.match(/(.*\/)sap\/ushell\/bootstrap\/appFinder\.js$/i)[1];window["sap-ui-config"]={resourceroots:{"":b},"xx-async":true};function l(u,c){var p=u.length,e=0;function a(E){p--;if(E.type==='error'){e++;}E.target.removeEventListener("load",a);E.target.removeEventListener("error",a);if(p===0&&e===0&&c){c();}}for(var i=0;i<u.length;i++){var s=document.createElement("script");s.addEventListener("load",a);s.addEventListener("error",a);s.src=b+u[i];document.head.appendChild(s);}}l(["sap/ui/thirdparty/baseuri.js","sap/ui/thirdparty/es6-promise.js","sap/ui/thirdparty/es6-string-methods.js"],function(){l(["ui5loader.js"],function(){l(["ui5loader-autoconfig.js"],function(){sap.ui.require(["sap/ushell/bootstrap/appfinder/appFinder-dev"],function(c){sap.ui.require(["sap/ui/core/Core"],function(a){a.boot();});});});});});}());
