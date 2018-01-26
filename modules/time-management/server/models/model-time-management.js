'use strict';

/**
 *  Name: The Time Management Schema
    Description: Determines how a time management is defined
 */

/**
 * Module dependencies
 */
var // mongoose
    mongoose = require('mongoose'),
    // mongoose schema
    Schema = mongoose.Schema,
    // validator
    validator = require('validator'),
    // the path
    path = require('path'),
    // lodash
    _ = require('lodash'),
    // the file system reader
    fs = require('fs'),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // the path to the file details for this view
    acceptableTMTypesPath = path.join(__dirname, '../data/acceptable-time-management-types.json'),
    // the acceptable values for the dates
    acceptableTMTypes = [];

/**
 * Time Management Schema
 */ 
var TimeManagementSchema = new Schema ({
    created: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    dates: {
        type: [{
            date: String,
            types: Array
        }],
        default: new Array()
    }
});

/**
 * Hook a pre validate method to test the validation
 */
TimeManagementSchema.pre('validate', function (next) {
    // set user
    var tm = this;

    // regex for date format
    var dateRegex = /^(?=.+([\/.-])..\1)(?=.{10}$)(?:(\d{4}).|)(\d\d).(\d\d)(?:.(\d{4})|)$/;
    
    // determins if validation is fine
    var validationFine = true;
    var validationError = null;

    // read the db
    readDB().then(function () {
        // check if all dates are correct format and have proper values
        _.forEach(tm.dates, function(date) {
            // if not correct format
            if(dateRegex.test(date.date)) {
                _.forEach(date.types, function(type) {
                    var foundType = null;

                    // check if the value exist
                    _.some(acceptableTMTypes, function(aType) {
                        const found = aType.toLowerCase() === type.toLowerCase();
                        if(found) {
                            foundType = aType;
                        }
                        return found;
                    });

                    // if found a type
                    if(foundType) {
                        type = foundType;
                    }
                    else {
                        validationFine = false;
                        validationError = `${type} is not a valid time management type`;
                        return;
                    }
                });
            }
            else {
                validationFine = false;
                validationError = `${date.date} is not a valid time management date format. Must be in yyyy-mm-dd format fo string`;
            }
        });

        // if fine
        if(validationFine) {
            next();
        }
        else {
            tm.invalidate('dates', validationError);
        }
    })
    .catch(function (err) {
        tm.invalidate('dates', err);
    });
});

// specify the transform schema option
if (!TimeManagementSchema.options.toObject) {
    TimeManagementSchema.options.toObject = {};
}

/**
 * Create instance method to return an object
 */
TimeManagementSchema.options.toObject.transform = function (doc, ret, options) {
    // if hide options
    if (options.hide) {
        // go through each option and remove
        options.hide.split(' ').forEach(function (prop) {
            delete ret[prop];
        });
    }

    // always hide the id and version
    //delete ret['_id'];
    delete ret['__v'];

    // return object
    return ret;
};

/**
 * Create static method to return time off types
 */
TimeManagementSchema.statics.getTimeOffTypes = function () {
    // read the db
    return readDB();
};

// set the static seed function
TimeManagementSchema.statics.seed = seed;

// model this Schema
mongoose.model('TimeManagement', TimeManagementSchema);

/**
* Seeds the TimeManagement collection with document (TimeManagement)
* and provided options.
*/
function seed(doc, options) {
    // get TimeManagement model
    var TimeManagement = mongoose.model('TimeManagement');
  
    return new Promise(function (resolve, reject) {
        skipDocument().then(findUser).then(add).then(function (response) {
            return resolve(response);
        })
        .catch(function (err) {
            return reject(err);
        });

        // find user
        function findUser(skip) {
            // get User model
            var User = mongoose.model('User');
      
            return new Promise(function (resolve, reject) {
                // if skipping
                if (skip) {
                    return resolve(true);
                }
      
                // find user
                User.findOne({ roles: { $in: ['user'] } }).exec(function (err, user) {
                    // error
                    if (err) {
                        return reject(err);
                    }
        
                    doc.user = user;
        
                    return resolve();
                });
            });
        };
  
        // skips a document
        function skipDocument() {
            return new Promise(function (resolve, reject) {
                TimeManagement.findOne({ 'user': doc.user }).exec(function (err, existing) {
                    // if error, reject
                    if (err) {
                        return reject(err);
                    }
    
                    // if doesn't exist, resolve
                    if (!existing) {
                        return resolve(false);
                    }
        
                    // if existing and not overwriting, resolve
                    if (existing && !options.overwrite) {
                        return resolve(true);
                    }
    
                    // remove TimeManagement (overwrite)
                    existing.remove(function (err) {
                        // if error, reject
                        if (err) {
                            return reject(err);
                        }
        
                        // resolve
                        return resolve(false);
                    });
                });
            });
        };
    
        // adds user
        function add(skip) {
            return new Promise(function (resolve, reject) {
                // if skip
                if (skip) {
                    return resolve({
                        message: clc.info(`Database Seeding: TimeManagement\t\t${doc.user} skipped`)
                    });
                }
    
                // create TimeManagement
                var tm = new TimeManagement(doc);
    
                // save TimeManagement
                tm.save(function (err) {
                    // if error
                    if (err) {
                        return reject(err);
                    }
    
                    return resolve({
                        message: `Database Seeding: TimeManagement for\t\t${tm.user.displayName} added`
                    });
                });
            });
        };
    });
};

/**
 * Read the DB middleware
 */
function readDB() {
    return new Promise(function (resolve, reject) {
        // check if file exists
        fs.stat(acceptableTMTypesPath, function(err, stats) {
            // if the file exists
            if (stats.isFile()) {
                // read content
                fs.readFile(acceptableTMTypesPath, 'utf8', (err, data) => {
                    // if error occurred
                    if (err) {
                        // send internal error
                        return reject(e);
                    }
                    else {
                        try {
                            // read content
                            acceptableTMTypes = JSON.parse(data);

                            // go to next
                            return resolve(acceptableTMTypes);
                        }
                        catch (e) {
                            // send internal error
                            return reject(e);
                        }                    
                    }
                });
            }
            else {
                // reinitialize
                acceptableTMTypes = [];

                // go to next
                return resolve(acceptableTMTypes);
            }
        });
    });
};