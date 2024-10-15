sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
    "use strict";

    // simple map wraper where element in the map is an array.
    // typically used with 'id' as key and array of items
    var ListMap = function() {
        this.map = new Map();
    };

    ListMap.prototype.get = function(key) {
        return this.map.get(key);
    };

    // return empty list if not exist
    ListMap.prototype.getOrCreate = function(key) {
        var val = this.map.get(key);
        if (!val) {
            val = [];
            this.map.set(key, val);
        }
        return val;
    };

    ListMap.prototype.set = function(key, val) {
        // todo: should we check if val is array?
        return this.map.set(key, val);
    };

    ListMap.prototype.keys = function() {
        return this.map.keys();
    };

    ListMap.prototype.values = function() {
        return this.map.values();
    };
    ListMap.prototype.delete = function(key) {
        return this.map.delete(key);
    };

    ListMap.prototype.clear = function() {
        this.map.clear();
    };

    Object.defineProperty(ListMap.prototype, "size", {
        get: function() { return this.map.size; }
    });

    return ListMap;
});
