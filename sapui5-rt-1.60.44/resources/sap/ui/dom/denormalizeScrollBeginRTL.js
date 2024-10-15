/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/Device","sap/ui/util/_FeatureDetection"],function(D,_){"use strict";var d;if(_.initialScrollPositionIsZero()){if(_.canScrollToNegative()){d=function(n,o){return-n;};}else{d=function(n,o){return n;};}}else{d=function(n,o){return o.scrollWidth-o.clientWidth-n;};}var f=function(n,o){if(o){return d(n,o);}};return f;});
