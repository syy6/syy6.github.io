// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*
 * This module provides with a factory to define the configuration for the FLP
 * core component.
 */
sap.ui.define([
],
function () {
    "use strict";

    function fnCreateConfigContract (oMergedSapUshellConfig) {

        function getConfigValue (sPath, oDefaultValue) {
            var oSegment = getValueFromConfig(sPath);

            return oSegment !== undefined ? oSegment : oDefaultValue;
        }

        function getValueFromConfig (sPath) {
            var aPathParts = sPath.split("/");
            var sLastPart = aPathParts.pop();
            var oDeepObject = aPathParts.reduce(function (oObject, sPathPart) {
                if (!oObject || !oObject.hasOwnProperty(sPathPart)) {
                    return {};
                }
                return oObject[sPathPart];
            }, oMergedSapUshellConfig);

            return oDeepObject[sLastPart];
        }

        /* This replaces the original logic for enableEasyAccess in the flp component
         * Both pairs enableEasyAccessSAPMenu / enableEasyAccessSAPMenuSearch
         *            and
         *            enableEasyAccessUserMenu / enableEasyAccessUserMenuSearch
         * follow the same logic:
         * Unless enableEasyAccess is true, set to false.
         * Then, the *MenuSearch parameter depends on the corresponding *Menu one
         * (*Menu is set independently).
         * If *Menu is defined and false, *MenuSearch will be false.
         * Else, if *MenuSearch exists we keep the value.
         * EnableEasyAccess is kept as a default.
         * */
        function enableSearchTest (sParentConfig, sOwnConfig) {
            var bEnableEasyAccess = getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined);
            var bParentConfig = getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/"+sParentConfig, undefined);
            var bOwnConfig = getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/"+sOwnConfig, undefined);

            bParentConfig = (bEnableEasyAccess === false) ? false : bParentConfig;
            bParentConfig = (bParentConfig !== undefined) ? bParentConfig : bEnableEasyAccess;

            if (bEnableEasyAccess == undefined || bEnableEasyAccess) {
                if (bParentConfig === false) {
                    return false;
                } else {
                    return (bOwnConfig !== undefined) ? bOwnConfig : bParentConfig;
                }
            } else {
                return false;
            }
        }
        /*
         * Contract of configuration defines *FLP* features and points to
         * the owner component of a feature. Each flag it must be expressed
         * with the following path prefix.
         *
         * "/<owner component short name>/<functionality>/<feature>"
         */
        var oConfigDefinition = {
            core: { // the unified shell core
                extension: {
                    enableHelp: getConfigValue("renderers/fiori2/componentData/config/enableHelp", false),
                    EndUserFeedback: getConfigValue("services/EndUserFeedback/config/enabled", true),
                    SupportTicket: getConfigValue("services/SupportTicket/config/enabled", false)
                },
                navigation: {
                    enableInPlaceForClassicUIs: {
                        GUI: getConfigValue("services/ClientSideTargetResolution/config/enableInPlaceForClassicUIs/GUI", false),
                        WDA: getConfigValue("services/ClientSideTargetResolution/config/enableInPlaceForClassicUIs/WDA", false),
                        WCF: getConfigValue("services/ClientSideTargetResolution/config/enableInPlaceForClassicUIs/WCF", true)
                    },
                    enableWebguiLocalResolution: true,
                    enableWdaLocalResolution: true,
                    flpURLDetectionPattern: getConfigValue("services/ClientSideTargetResolution/config/flpURLDetectionPattern", "[/]FioriLaunchpad.html[^#]+#[^-]+?-[^-]+")
                },
                notifications: {
                    enableNotificationsPreview: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/initialStateNotificationsPreview",
                        getConfigValue("services/Notifications/config/enableNotificationsPreview", false))
                },
                shell: {
                    animationMode: getConfigValue("renderers/fiori2/componentData/config/animationMode", 'full'),
                    enablePersonalization: getConfigValue("renderers/fiori2/componentData/config/enablePersonalization",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enablePersonalization", true)),
                    enableRecentActivity: getConfigValue("renderers/fiori2/componentData/config/enableRecentActivity", true),
                    enableRecentActivityLogging: getConfigValue("renderers/fiori2/componentData/config/enableRecentActivityLogging", true),
                    enableFiori3: getConfigValue("ushell/shell/enableFiori3", false),
                    model: {
                        enableSAPCopilotWindowDocking: undefined,
                        enableBackGroundShapes: true,
                        personalization: undefined,
                        contentDensity: undefined,
                        setTheme: undefined,
                        userDefaultParameters: undefined,
                        disableHomeAppCache: undefined,
                        enableHelp: undefined,
                        ShellAppTitleState: undefined,
                        enableTrackingActivity: undefined,
                        animationMode: "full",
                        searchAvailable: false,
                        title: "", // no default value for title
                        searchFiltering: true,
                        showEndUserFeedback: false,
                        searchTerm: "",
                        isPhoneWidth: false,
                        enableNotifications: false,
                        enableNotificationsUI: false,
                        notificationsCount: 0,
                        currentViewPortState: "Center",
                        userStatus: undefined,
                        migrationConfig: undefined,
                        allMyAppsMasterLevel: undefined,
                        options: [],
                        userStatusUserEnabled: true,
                        shellAppTitleData: {
                            currentViewInPopover : "navigationMenu",
                            enabled: false,
                            showGroupsApps: false,
                            showCatalogsApps: false,
                            showExternalProvidersApps: false
                        },
                        userPreferences: {
                            dialogTitle: "Settings",
                            isDetailedEntryMode: false,
                            activeEntryPath: null,
                            entries: [],
                            profiling: []
                        },
                        userImage: {
                            personPlaceHolder : "sap-icon://person-placeholder",
                            account: "sap-icon://account"
                        },
                        currentState: {
                            stateName: "blank",
                            showCurtain: false,
                            headerVisible: true,
                            showCatalog: false,
                            showPane: false,
                            showRightFloatingContainer: false,
                            headItems: [
                            ],
                            showRecentActivity: true,
                            headEndItems: [
                            ],
                            search: "",
                            paneContent: [],
                            actions: [
                            ],
                            floatingActions: [],
                            subHeader: [],
                            toolAreaItems: [],
                            RightFloatingContainerItems: [],
                            toolAreaVisible: false,
                            floatingContainerContent: [],
                            application: {
                            },
                            showLogo: false
                        }
                    }
                },
                home: {
                    animationRendered: false,
                    disableSortedLockedGroups: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/disableSortedLockedGroups", false),
                    draggedTileLinkPersonalizationSupported: true,
                    editTitle: false,
                    enableActionModeFloatingButton: getConfigValue("renderers/fiori2/componentData/config/enableActionModeFloatingButton",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableActionModeFloatingButton", true)),
                    enableActionModeMenuButton: getConfigValue("renderers/fiori2/componentData/config/enableActionModeMenuButton",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableActionModeMenuButton", true)),
                    enableDragIndicator: getConfigValue("renderers/fiori2/componentData/config/enableDragIndicator",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableDragIndicator", false)),
                    enableHomePageSettings: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableHomePageSettings", true),
                    enableLockedGroupsCompactLayout: getConfigValue("renderers/fiori2/componentData/config/enableLockedGroupsCompactLayout",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableLockedGroupsCompactLayout", false)),
                    enableRenameLockedGroup: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableRenameLockedGroup", false),
                    enableTileActionsIcon: getConfigValue("renderers/fiori2/componentData/config/enableTileActionsIcon",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableTileActionsIcon", false)),
                    enableTilesOpacity: getConfigValue("services/ClientSideTargetResolution/config/enableTilesOpacity",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableTilesOpacity", true)),
                    homePageGroupDisplay: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/homePageGroupDisplay", "scroll"),
                    isInDrag: false,
                    optimizeTileLoadingThreshold: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/optimizeTileLoadingThreshold", 100),
                    sizeBehavior: getConfigValue("renderers/fiori2/componentData/config/sizeBehavior", "Responsive"),
                    sizeBehaviorConfigurable: getConfigValue("renderers/fiori2/componentData/config/sizeBehaviorConfigurable", false),
                    wrappingType: getConfigValue("ushell/home/tilesWrappingType", "Normal"),
                    segments: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/segments", undefined),
                    tileActionModeActive: false,
                    tileActionModeEnabled: getConfigValue("renderers/fiori2/componentData/config/enableActionModeMenuButton",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableActionModeMenuButton", true))
                        ||
                        getConfigValue("renderers/fiori2/componentData/config/enableActionModeFloatingButton",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableActionModeFloatingButton", true))
                },
                catalog: {

                    appFinderDisplayMode: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/appFinderDisplayMode", undefined),
                    easyAccessNumbersOfLevels: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/easyAccessNumbersOfLevels", undefined),
                    enableCatalogSearch: getConfigValue("renderers/fiori2/componentData/config/enableSearchFiltering",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableSearchFiltering",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableCatalogSearch", true))),
                    enableCatalogSelection: getConfigValue("renderers/fiori2/componentData/config/enableCatalogSelection",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableCatalogSelection", true)),
                    enableCatalogTagFilter: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableTagFiltering",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableCatalogTagFilter", true)),
                    enableEasyAccess: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined),
                    enableEasyAccessSAPMenu: (getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined) === false)
                        ?
                        false
                        :
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccessSAPMenu",
                            getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined)),
                    enableEasyAccessSAPMenuSearch: enableSearchTest("enableEasyAccessSAPMenu", "enableEasyAccessSAPMenuSearch"),
                    enableEasyAccessUserMenu: (getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined) === false)
                        ?
                        false
                        :
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccessUserMenu",
                            getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableEasyAccess", undefined)),
                    enableEasyAccessUserMenuSearch: enableSearchTest("enableEasyAccessUserMenu", "enableEasyAccessUserMenuSearch"),
                    enableHideGroups: getConfigValue("renderers/fiori2/componentData/config/enableHideGroups",
                        getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/enableHideGroups", true)),
                    sapMenuServiceUrl: undefined,
                    userMenuServiceUrl: getConfigValue("renderers/fiori2/componentData/config/applications/Shell-home/userMenuServiceUrl", undefined)
                }
            }
        };

        return oConfigDefinition;
    }

    return fnCreateConfigContract;
}, false);
