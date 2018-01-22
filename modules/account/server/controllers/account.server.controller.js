'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // chalk for console logging
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
    User = require(path.resolve('./modules/account/server/models/model-user'));

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
        'username': _.has(req.body, 'username') ? req.body.username : undefined
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
                res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
            } 
            else {
                // update the values
                User.update(req.user, updatedValues, function(err, updatedUser) {
                    // if an error occurred
                    if (err) {
                        // send internal error
                        res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    }
                    else if (updatedUser) {
                        // create the safe user object
                        var safeUserObj = createUserReqObject(updatedUser);

                        // set the updated object
                        var p = req.user.paymentInfo;
                        req.user = safeUserObj;
                        req.user.paymentInfo = p;

                        // read the profile
                        module.exports.readProfile(req, res);
                    }
                    else {
                        // send internal error
                        res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                        console.log(clc.error(`In ${path.basename(__filename)} \'updateProfile\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t update User.'));
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
    req.checkBody('newPassword', `Please enter a passphrase or password with ${config.shared.owasp.minLength} or more characters, numbers, lowercase, uppercase, and special characters.`).isStrongPassword();
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
            res.status(400).send({ title: errorHandler.getErrorTitle({ code: 400 }), message: errorText });
        } 
        else {
            // find user based on id
            User.findById(req.user._id, function(err, foundUser) {
                // if error occurred occurred
                if (err) {
                    // return error
                    return next(err);
                }
                // if user was found
                else if(foundUser) {
                    // compare current password equality
                    User.comparePassword(foundUser, req.body.oldPassword, function(err, isMatch) {
                        // if error occurred occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                        }
                        else if(!isMatch) {
                            // return error
                            res.json({ 'd': { error: true, title: errorHandler.getErrorTitle({ code: 200 }), message: 'Current password does not match.' } });
                        }
                        else {
                            // check if user entered a previous password
                            User.compareLastPasswords(foundUser, req.body.newPassword, function(err, isPastPassword) {
                                // if error occurred occurred
                                if (err) {
                                    // send internal error
                                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                                }
                                else if(isPastPassword) {
                                    // return error
                                    res.json({ 'd': { error: true, title: errorHandler.getErrorTitle({ code: 200 }), message: 'This password was used within the last 5 password changes. Please choose a different one.' } });
                                }
                                else {
                                    // create the updated values object
                                    var updatedValues = {
                                        'password': req.body.newPassword
                                    };

                                    // update user
                                    User.update(foundUser, updatedValues, function(err, updatedUser) {
                                        // if error occurred occurred
                                        if (err) {
                                            // send internal error
                                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                                        }
                                        else if(updatedUser) {
                                            // create the safe user object
                                            var safeUserObj = createUserReqObject(updatedUser);

                                            // set the updated object
                                            var p = req.user.paymentInfo;
                                            req.user = safeUserObj;
                                            req.user.paymentInfo = p;

                                            // return password changed
                                            res.json({ 'd': { title: errorHandler.getErrorTitle({ code: 200 }), message: errorHandler.getGenericErrorMessage({ code: 200 }) + ' Successful password change.' } });
                                        }
                                        else {
                                            // send internal error
                                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                                            console.log(clc.error(`In ${path.basename(__filename)} \'changePassword\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t update User.'));
                                        }
                                    });
                                }
                            });
                        }
                    });	
                }
                else {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                    console.log(clc.error(`In ${path.basename(__filename)} \'changePassword\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t find User.'));
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
    // clone to not overwrite
    var safeObj = _.cloneDeep(user);

    // save the id since it will be lost when going to object
    // hide the information for security purposes
    var id = safeObj._id;
    safeObj = User.toObject(safeObj, { 'hide': 'password lastPasswords internalName created' });
    safeObj._id = id;

    // return the safe obj
    return safeObj;
};