'use strict';

/**
 *  Name: The Time Management Schema
    Description: Determines how a time management is defined
 */

/**
 * Module dependencies
 */
var // generate UUID's
    uuidv1 = require('uuid/v1'),
    // lodash
    _ = require('lodash'),
    // the path
    path = require('path'),
    // the helper functions
    helpers = require(path.resolve('./config/lib/global-model-helpers')),
    // the db
    db = require('./db/time-management'),
    // the db full path
    dbPath = 'modules/time-management/server/models/db/time-management.json';

/**
 * Time Management Schema
 */ 
var TimeManagementSchema = {
    _id: {
        type: String,
        overwriteable: false
    },
    created: {
        type: Date,
        overwriteable: false
    },
    userId: {
        type: String
    },
    dates: {
        type: Object,
        default: {}
    }
};

// the required properties
var requiredSchemaProperties = helpers.getRequiredProperties(TimeManagementSchema);

// the non overwritable properties the user cannot self change
var nonOverwritableSchemaProperties = helpers.getNonOverwritableProperties(TimeManagementSchema);

// the non default properties
var defaultSchemaProperties = helpers.getDefaultProperties(TimeManagementSchema);

// the searchable properties
var searchableSchemaProperties = helpers.getSearchableProperties(TimeManagementSchema);

// the acceptable value properties
var acceptableValuesSchemaProperties = helpers.getAcceptableValuesProperties(TimeManagementSchema);

// the trimmable value properties
var trimmableSchemaProperties = helpers.getTrimmableProperties(TimeManagementSchema);

/**
 * Converts to object
 */
exports.toObject = function(obj, options) {
    // return the obj
    return _.cloneDeep(helpers.toObject(obj, options));
};

/**
 * Find By Id
 */
exports.findById = function(id, callback) {
    // find one
    helpers.findById(db, id, function(err, obj) {
        // if a callback
        if(callback) {
            // hit the callback
            callback(err, _.cloneDeep(obj));
        }
    });
};

/**
 * Find One
 */
exports.findOne = function(query, callback) {
    // find one
    helpers.findOne(db, query, function(err, obj) {
        // if a callback
        if(callback) {
            // hit the callback
            callback(err, _.cloneDeep(obj));
        }
    });
};

/**
 * Save
 */
exports.save = function(objToSave, callback) {
    // the object to return
    var obj = null;
    
    // the error to return
    var err = null;

    // the first property value that isn't present
    var firstProp = helpers.checkRequiredProperties(requiredSchemaProperties, objToSave);
    
    // if there is a property that doesn't exist
    if(firstProp) {
        // create new error
        err = new Error(`All required properties are not present on object. The property \'${firstProp}\' was not in the object.`);
    }
    else {
        // remove any keys that may have tried to been overwritten
        helpers.removeAttemptedNonOverwritableProperties(nonOverwritableSchemaProperties, objToSave);

        // check and set acceptable values
        helpers.checkAndSetAcceptableValueForProperties(acceptableValuesSchemaProperties, TimeManagementSchema, objToSave);

        // trim any values
        helpers.trimValuesForProperties(trimmableSchemaProperties, objToSave);

        // find the object matching the object index
        var index = _.findIndex(db, { '_id': objToSave._id });
        obj = index != -1 ? db[index] : null;

        // if object was found
        if(obj) {
            // merge old data with new data
            _.mergeWith(obj, objToSave, function (objValue, srcValue) {
                // if array, replace array
                if (_.isArray(objValue)) {
                    return srcValue;
                }
            });

            // replace item at index using native splice
            db.splice(index, 1, obj);

            // update the db
            helpers.updateDB(dbPath, db, function(e) {
                // set error
                err = e;

                // if error, reset object
                obj = err ? null : obj;

                // if a callback
                if(callback) {
                    // hit the callback
                    callback(err, _.cloneDeep(obj));
                }
            });
        }
        else {
            // set all defaults
            helpers.setNonOverwritablePropertyDefaults(defaultSchemaProperties, TimeManagementSchema, objToSave);
            helpers.setNonExisistingPropertyDefaults(defaultSchemaProperties, TimeManagementSchema, objToSave);

            // generate UUID
            objToSave._id = uuidv1();

            // set created date
            objToSave.created = new Date();

            // push the new object
            db.push(objToSave);

            // update the db
            helpers.updateDB(dbPath, db, function(e) {
                // set error
                err = e;

                // if error, reset object
                objToSave = err ? null : objToSave;

                // if a callback
                if(callback) {
                    // hit the callback
                    callback(err, _.cloneDeep(objToSave));
                }
            });
        }
    }
};

/**
 * Update
 */
exports.update = function(query, updatedObj, callback) {
    // the object to return
    var obj = null;
    
    // the error to return
    var err = null;

    // find the object matching the object index
    var index = _.findIndex(db, { '_id': query._id });
    obj = index != -1 ? db[index] : null;

    // if object was found
    if(obj) {
        // remove any keys that may have tried to been overwritten
        helpers.removeAttemptedNonOverwritableProperties(nonOverwritableSchemaProperties, updatedObj);

        // check and set acceptable values
        helpers.checkAndSetAcceptableValueForProperties(acceptableValuesSchemaProperties, TimeManagementSchema, updatedObj);

        // trim any values
        helpers.trimValuesForProperties(trimmableSchemaProperties, updatedObj);

        // merge old data with new data
        _.mergeWith(obj, updatedObj, function (objValue, srcValue) {
            // if array or object, replace array or object
            if (_.isArray(objValue) || _.isObject(objValue)) {
                return srcValue;
            }
        });

        // replace item at index using native splice
        db.splice(index, 1, obj);

        // update the db
        helpers.updateDB(dbPath, db, function(e) {
            // set error
            err = e;

            // if error, reset object
            obj = err ? null : obj;

            // if a callback
            if(callback) {
                // hit the callback
                callback(err, _.cloneDeep(obj));
            }
        });
    }
    else {
        // if a callback
        if(callback) {
            // hit the callback
            callback(err, _.cloneDeep(obj));
        }
    }
};