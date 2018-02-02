'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // the application configuration
    config = require(path.resolve('./config/config')),
    // lodash
    _ = require('lodash'),
    // the file system reader
    fs = require('fs'),
    // the helper functions
    helpers = require(path.resolve('./config/lib/global-model-helpers')),
    // the path to the file details for this view
    accountDetailsPath = path.join(__dirname, '../data/account.json'),
    // the file details for this view
    accountDetails = {},
    // the User model
    User = require('mongoose').model('User');

/**
 * Show the current page
 */
exports.read = function (req, res) {
    // send data
    res.json({ 'd': accountDetails });
};

/**
 * Get the profile details
 */
exports.readProfile = function (req, res) {
    // create safe profile object
    var user = createUserReqObject(req.user);

    // send data
    res.json({ 'd': user });
};

/**
 * Updates the profile details
 */
exports.updateProfile = function (req, res) {
    // create the updated values object
    var updatedValues = {
        'firstName': _.has(req.body, 'firstName') ? req.body.firstName : undefined,
        'lastName': _.has(req.body, 'lastName') ? req.body.lastName : undefined,
        'username': _.has(req.body, 'username') ? req.body.username : undefined,
        'email': _.has(req.body, 'email') ? req.body.email : undefined
    };

    // remove all undefined members
    helpers.removeUndefinedMembers(updatedValues);

    // if there is something to update
    if(Object.keys(updatedValues).length > 0) {
        // if first name
        if(updatedValues.firstName) {
            req.checkBody('firstName', 'First name must contain only letters.').onlyContainsAlphaCharacters();
        }

        // if last name
        if(updatedValues.lastName) {
            req.checkBody('lastName', 'Last name must contain only letters.').onlyContainsAlphaCharacters();
        }

        // validate errors
        req.getValidationResult().then(function(errors) {
            // if any errors exists
            if(!errors.isEmpty()) {
                // holds all the errors in one text
                var errorText = '';

                // add all the errors
                for(var x = 0; x < errors.array().length; x++) {
                    // if not the last error
                    if(x < errors.array().length - 1) {
                        errorText += errors.array()[x].msg + '\r\n';
                    }
                    else {
                        errorText += errors.array()[x].msg;
                    }
                }

                // send bad request
                err = new Error(errorText);
                res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
                errorHandler.logError(req, err);
            } 
            else {
                // update the values
                req.user.firstName = updatedValues.firstName ? updatedValues.firstName : req.user.firstName;
                req.user.lastName = updatedValues.lastName ? updatedValues.lastName : req.user.lastName;
                req.user.username = updatedValues.username ? updatedValues.username : req.user.username;
                req.user.email = updatedValues.email ? updatedValues.email : req.user.email;

                // update user
                req.user.save(function(err) {
                    // if error occurred
                    if (err) {
                        // send internal error
                        res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                        errorHandler.logError(req, err);
                    }
                    else {
                        // read the profile
                        module.exports.readProfile(req, res);
                    }
                });
            }
        });
    }
    else {
        // read the profile
        module.exports.readProfile(req, res);
    }
};

/**
 * Updates password
 */
exports.updatePassword = function (req, res) {
    // validate existence
    req.checkBody('oldPassword', 'Old password is required.').notEmpty();
    req.checkBody('newPassword', 'New password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password is required.').notEmpty();
    req.checkBody('confirmedPassword', 'Confirmed password should be equal to new password.').isEqual(req.body.newPassword);

    // validate errors
    req.getValidationResult().then(function(errors) {
        // if any errors exists
        if(!errors.isEmpty()) {
            // holds all the errors in one text
            var errorText = '';

            // add all the errors
            for(var x = 0; x < errors.array().length; x++) {
                // if not the last error
                if(x < errors.array().length - 1) {
                    errorText += errors.array()[x].msg + '\r\n';
                }
                else {
                    errorText += errors.array()[x].msg;
                }
            }

            // send bad request
            err = new Error(errorText);
            res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
            errorHandler.logError(req, err);
        } 
        else {
            // compare current password equality
            req.user.comparePassword(req.body.oldPassword, function(err, isMatch) {
                // if error occurred occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else if(!isMatch) {
                    // return error
                    const errorText = 'Current password does not match';
                    err = new Error(errorText);
                    res.json({ 'd': { error: true, title: errorText, message: errorText } });
                    errorHandler.logError(req, err);
                }
                else {
                    // save new password
                    req.user.password = req.body.newPassword;

                    // update user
                    req.user.save(function(err) {
                        // if error occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            errorHandler.logError(req, err);
                        }
                        else {
                            // read the profile
                            module.exports.readProfile(req, res);
                        }
                    });
                }
            });	
        }
    });
};

/**
 * Resets password
 */
exports.resetPassword = function (req, res) {
    // validate existence
    req.checkBody('username', 'Username is required.').notEmpty();
    
    // validate errors
    req.getValidationResult().then(function(errors) {
        // if any errors exists
        if(!errors.isEmpty()) {
            // holds all the errors in one text
            var errorText = '';

            // add all the errors
            for(var x = 0; x < errors.array().length; x++) {
                // if not the last error
                if(x < errors.array().length - 1) {
                    errorText += errors.array()[x].msg + '\r\n';
                }
                else {
                    errorText += errors.array()[x].msg;
                }
            }

            // send bad request
            err = new Error(errorText);
            res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
            errorHandler.logError(req, err);
        } 
        else {
            // find user based on username
            User.findOne({ 'username': req.body.username }, function(err, foundUser) {
                // if error occurred occurred
                if (err) {
                    // return error
                    return next(err);
                }
                // if user was found
                else if(foundUser) {
                    // save new password
                    foundUser.password = 'Pass@Word1';

                    // update user
                    foundUser.save(function(err) {
                        // if error occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            errorHandler.logError(req, err);
                        }
                        else {
                            // return password reset
                            res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: 'Password reset was a success!' } });
                        }
                    });
                }
                else {
                    // return error
                    const errorText = `No user by the name of '${req.body.username}' was found`;
                    err = new Error(errorText);
                    res.json({ 'd': { error: true, title: errorText, message: errorText } });
                    errorHandler.logError(req, err);
                }
            });
        }
    });
};

/**
 * Read the DB middleware
 */
exports.readDB = function (req, res, next) {
    // holds the needed number of completed reads
    var needCompleted = 1;

    // holds the number of completed reads
    var completed = 0;

    // check if file exists
    fs.stat(accountDetailsPath, function(err, stats) {
        // if the file exists
        if (stats.isFile()) {
            // read content
            fs.readFile(accountDetailsPath, 'utf8', (err, data) => {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else {
                    try {
                        // read content
                        accountDetails = JSON.parse(data);

                        // increase the count
                        completed++;

                        // if reached the needed count
                        if(needCompleted == completed) {
                            // go to next
                            next();
                        }
                    }
                    catch (e) {
                        // set error
                        err = e;

                        // send internal error
                        res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                        errorHandler.logError(req, err);
                    }
                }
            });
        }
        else {
            // reinitialize
            accountDetails = {};

            // increase the count
            completed++;
            
            // if reached the needed count
            if(needCompleted == completed) {
                // go to next
                next();
            }
        }
    });
};

// creates the safe user object to set in the request
function createUserReqObject(user) {
    // get object value
    var safeObj = user.toObject({ hide: '_id password lastPasswords', transform: false });

    // return the safe obj
    return safeObj;
};