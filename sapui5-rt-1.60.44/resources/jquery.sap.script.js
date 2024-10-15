/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global','sap/base/util/uid','sap/base/strings/hash','sap/base/util/array/uniqueSort','sap/base/util/deepEqual','sap/base/util/each','sap/base/util/array/diff','sap/base/util/JSTokenizer','sap/base/util/merge','sap/base/util/UriParameters','sap/ui/util/openWindow','sap/ui/util/isCrossOriginURL','sap/ui/util/defaultLinkTypes'],function(q,u,h,a,d,e,b,J,m,U,o,c,f){"use strict";q.sap.uid=u;q.sap.hashCode=h;q.sap.unique=a;q.sap.equal=d;q.sap.each=e;q.sap.arraySymbolDiff=b;q.sap._createJSTokenizer=function(){return new J();};q.sap.parseJS=J.parseJS;q.sap.extend=function(){var g=arguments,j=false;if(typeof arguments[0]==="boolean"){j=arguments[0];g=Array.prototype.slice.call(arguments,1);}if(j){return m.apply(this,g);}else{
/*
			 * The code in this function is taken from jQuery 2.2.3 "jQuery.extend" and got modified.
			 *
			 * jQuery JavaScript Library v2.2.3
			 * http://jquery.com/
			 *
			 * Copyright jQuery Foundation and other contributors
			 * Released under the MIT license
			 * http://jquery.org/license
			 */
var k,n,l,t=arguments[0]||{},i=1,p=arguments.length;if(typeof t!=="object"&&typeof t!=="function"){t={};}for(;i<p;i++){l=arguments[i];for(n in l){k=l[n];if(n==="__proto__"||t===k){continue;}t[n]=k;}}return t;}};q.sap.getUriParameters=function getUriParameters(s){s=s?s:window.location.href;return new U(s);};q.sap.delayedCall=function delayedCall(D,O,g,p){return setTimeout(function(){if(q.type(g)=="string"){g=O[g];}g.apply(O,p||[]);},D);};q.sap.clearDelayedCall=function clearDelayedCall(D){clearTimeout(D);return this;};q.sap.intervalCall=function intervalCall(i,O,g,p){return setInterval(function(){if(q.type(g)=="string"){g=O[g];}g.apply(O,p||[]);},i);};q.sap.clearIntervalCall=function clearIntervalCall(i){clearInterval(i);return this;};q.sap.forIn=e;q.sap.arrayDiff=function(O,n,C,g){C=C||function(v,V){return d(v,V);};var k=[];var N=[];var M=[];for(var i=0;i<n.length;i++){var l=n[i];var F=0;var t;if(g&&C(O[i],l)){F=1;t=i;}else{for(var j=0;j<O.length;j++){if(C(O[j],l)){F++;t=j;if(g||F>1){break;}}}}if(F==1){var p={oldIndex:t,newIndex:i};if(M[t]){delete k[t];delete N[M[t].newIndex];}else{N[i]={data:n[i],row:t};k[t]={data:O[t],row:i};M[t]=p;}}}for(var i=0;i<n.length-1;i++){if(N[i]&&!N[i+1]&&N[i].row+1<O.length&&!k[N[i].row+1]&&C(O[N[i].row+1],n[i+1])){N[i+1]={data:n[i+1],row:N[i].row+1};k[N[i].row+1]={data:k[N[i].row+1],row:i+1};}}for(var i=n.length-1;i>0;i--){if(N[i]&&!N[i-1]&&N[i].row>0&&!k[N[i].row-1]&&C(O[N[i].row-1],n[i-1])){N[i-1]={data:n[i-1],row:N[i].row-1};k[N[i].row-1]={data:k[N[i].row-1],row:i-1};}}var D=[];if(n.length==0){for(var i=0;i<O.length;i++){D.push({index:0,type:'delete'});}}else{var r=0;if(!k[0]){for(var i=0;i<O.length&&!k[i];i++){D.push({index:0,type:'delete'});r=i+1;}}for(var i=0;i<n.length;i++){if(!N[i]||N[i].row>r){D.push({index:i,type:'insert'});}else{r=N[i].row+1;for(var j=N[i].row+1;j<O.length&&(!k[j]||k[j].row<i);j++){D.push({index:i+1,type:'delete'});r=j+1;}}}}return D;};q.sap.openWindow=o;q.sap.defaultLinkTypes=f;q.sap.isCrossOriginURL=c;return q;});
