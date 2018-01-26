/**
 * Module dependencies
 */
var // lodash
    _ = require('lodash'),
    // the file system to read/write from/to files locally
    fs = require('fs');

/**
 * Trim string value
 */
exports.trimString = function (value) {
    // return the trimmed value
    return _.trim(value);
};

/**
 * Trim array of strings
 */
exports.trimArrayOfString = function (arr) {
    // return the trimmed values
    return _.map(arr, _.trim);;
};

/**
 * Removes undefined members of object
 */
exports.removeUndefinedMembers = function(obj) {
    // go through each option and remove
    _.forEach(Object.keys(obj), function (value) {
        // if undefined
        if(obj[value] === undefined) {
            delete obj[value];
        }
    });
};