'use strict';

/**
 *  Name: The User Schema
    Description: Determines how a user is defined
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
    db = require('./db/users'),
    // the db full path
    dbPath = 'modules/account/server/models/db/users.json',
    // get the default config
	defaultConfig = require(path.resolve('./config/env/default')),
    // bcrypt for cryptography
    bcrypt = require('bcryptjs');

/**
 * User Schema
 */ 
var UserSchema = {
    _id: {
        type: String,
        overwriteable: false
    },
    created: {
        type: Date,
        overwriteable: false
    },
    internalName: {
        type: String,
        overwriteable: false
    },
    roles: {
        type: String,
        enum: ['user', 'admin'],
        default: ['user']
    },
    displayName: {
        type: String,
        overwriteable: false,
        trim: true
    },
    firstName: {
        type: String,
        trim: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    passwordUpdatedLast: {
        type: Date,
        overwriteable: false
    },
    lastPasswords: {
        type: Array,
        overwriteable: false,
        default: new Array(),
        max: 5
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
};

// the required properties
var requiredSchemaProperties = helpers.getRequiredProperties(UserSchema);

// the non overwritable properties the user cannot self change
var nonOverwritableSchemaProperties = helpers.getNonOverwritableProperties(UserSchema);

// the non default properties
var defaultSchemaProperties = helpers.getDefaultProperties(UserSchema);

// the searchable properties
var searchableSchemaProperties = helpers.getSearchableProperties(UserSchema);

// the acceptable value properties
var acceptableValuesSchemaProperties = helpers.getAcceptableValuesProperties(UserSchema);

// the trimmable value properties
var trimmableSchemaProperties = helpers.getTrimmableProperties(UserSchema);

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
        helpers.checkAndSetAcceptableValueForProperties(acceptableValuesSchemaProperties, UserSchema, objToSave);

        // trim any values
        helpers.trimValuesForProperties(trimmableSchemaProperties, objToSave);

        // find the object matching the object index
        var index = _.findIndex(db, { 'internalName': objToSave.username ? objToSave.username.toLowerCase() : objToSave.username });
        obj = index != -1 ? db[index] : null;

        // if object was found
        if(obj) {
            // if username was changed
            if(objToSave.username) {
                // update the internal name
                objToSave.internalName = objToSave.username.toLowerCase();
            }
            
            // encrypt password
            encryptPassword(objToSave, function(err) {
                // if error occurred
                if(err) {
                    return callback(err);
                }
                else {
                    // merge old data with new data
                    _.mergeWith(obj, objToSave, function (objValue, srcValue) {
                        // if array, replace array
                        if (_.isArray(objValue)) {
                            return srcValue;
                        }
                    });

                    // set display name
                    obj.displayName = `${obj.firstName} ${obj.lastName}`;

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
            });
        }
        else {
            // set all defaults
            helpers.setNonOverwritablePropertyDefaults(defaultSchemaProperties, UserSchema, objToSave);
            helpers.setNonExisistingPropertyDefaults(defaultSchemaProperties, UserSchema, objToSave);

            // encrypt password
            encryptPassword(objToSave, function(err) {
                // if error occurred
                if(err) {
                    return callback(err);
                }
                else {
                    // generate UUID
                    objToSave._id = uuidv1();

                    // set created date
                    objToSave.created = new Date();

                    // set the internal name
                    objToSave.internalName = objToSave.username.toLowerCase();

                    // set display name
                    objToSave.displayName = `${objToSave.firstName} ${objToSave.lastName}`;

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
        helpers.checkAndSetAcceptableValueForProperties(acceptableValuesSchemaProperties, UserSchema, updatedObj);

        // trim any values
        helpers.trimValuesForProperties(trimmableSchemaProperties, updatedObj);

        // add the last passwords to this object if changing the password
        updatedObj.password ? updatedObj.lastPasswords = obj.lastPasswords : updatedObj;
        
        // if username was changed
        if(updatedObj.username) {
            // update the internal name
            obj.internalName = updatedObj.username.toLowerCase();
        }

        // encrypt password
        encryptPassword(updatedObj, function(err) {
            // if error occurred
            if(err) {
                // if a callback
                if(callback) {
                    // hit the callback
                    callback(err);
                }
            }
            else {
                // merge old data with new data
                _.mergeWith(obj, updatedObj, function (objValue, srcValue) {
                    // if array, replace array
                    if (_.isArray(objValue)) {
                        return srcValue;
                    }
                });

                // set display name
                obj.displayName = `${obj.firstName} ${obj.lastName}`;

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

/**
 * Compares password
 */
exports.comparePassword = function(user, plainTextPassword, callback) {
    // compare the passwords
    bcrypt.compare(plainTextPassword, user.password, function(err, isMatch) {
        // if error occurred
        if (err) {
            // if a callback
            if(callback) {
                // hit the callback
                callback(err);
            }
        } 
        else if(callback) {
            // hit the callback
            callback(null, isMatch);
        }
    });
};

/**
 * Compares last passwords
 */
exports.compareLastPasswords = function(user, plainTextPassword, callback) {
    // holds all the indice that have completed the functionality
    var indicesCompleted = 0;

    // check if this is a past password
    _.forEach(user.lastPasswords, function (value) {
        // compare the passwords
        bcrypt.compare(plainTextPassword, value, function(err, isMatch) {
            // increase the number of indicies
            indicesCompleted++;

            // if error occurred
            if (err) {
                // if a callback
                if(callback) {
                    // hit the callback
                    callback(err);
                    return;
                }
            } 
            else if(isMatch) {
                // hit the callback
                callback(null, isMatch);

                return;
            }
            else if(indicesCompleted == user.lastPasswords.length) {
                // hit the callback
                callback(null, isMatch);
            }
        });
    });
};

// encrypt password
function encryptPassword(user, callback) {
    // if password exists
    if(user.password) {
        // generate a salt
        bcrypt.genSalt(defaultConfig.saltRounds, function(err, salt) {
            // if error occurred
            if (err) {
                // if a callback
                if(callback) {
                    // hit the callback
                    callback(err);
                }
            }

            // hash the password using our new salt
            bcrypt.hash(user.password, salt, function(err, hash) {
                // if error occurred
                if (err) {
                    // if a callback
                    if(callback) {
                        // hit the callback
                        callback(err);
                    }
                } 

                // override the cleartext password with the hashed one
                user.password = hash;

                // set password updated last
                user.passwordUpdatedLast = new Date();

                // check if the max number of last passwords that have been reached
                if(user.lastPasswords.length == UserSchema.lastPasswords.max) {
                    // pop off the last element
                    user.lastPasswords.pop();
                }
                
                // add to the list of last passwords used
                user.lastPasswords.unshift(hash);

                // if a callback
                if(callback) {
                    // hit the callback
                    callback();
                }
            });
        });
    }
    else {
        // if a callback
        if(callback) {
            // hit the callback
            callback();
        }
    }
};