/*
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 *
 * This module configures the ui5loader in the way that ushell needs.
 */
(function(){"use strict";var u=window.sap&&window.sap.ui&&window.sap.ui.loader;if(!u){throw new Error("FLP bootstrap: ui5loader is needed, but could not be found");}var c={},s=document.getElementById("sap-ui-bootstrap"),S=s&&s.getAttribute("src"),r=/^((?:.*\/)?resources\/~\d{14}~\/)/,b;if(S&&r.test(S)){b=r.exec(S)[1];window["sap-ui-config"]=window["sap-ui-config"]||{};window["sap-ui-config"]["resourceRoots"]=window["sap-ui-config"]["resourceRoots"]||{};window["sap-ui-config"]["resourceRoots"][""]=b;}u.config(c);}());
