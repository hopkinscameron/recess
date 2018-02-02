'use strict';

/**
 * Module dependencies
 */
var // the path
    path = require('path'),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // error message center
    errorMessageCenter = require(path.resolve('./config/lib/errorMessages')),
    // the Error model
    ErrorModel = require('mongoose').model('ErrorModel');

/**
 * Get the error title from error object
 */
exports.getErrorTitle = function (err) {
    var title = '';

    if (err.code) {
        switch (err.code) {
            case 200:
                title = errorMessageCenter.error.status200.title;
                break;
            case 400:
                title = errorMessageCenter.error.status400.title;
                break;
            case 401:
                title = errorMessageCenter.error.status401.title;
                break;
            case 403:
                title = errorMessageCenter.error.status403.title;
                break;
            case 404:
                title = errorMessageCenter.error.status404.title;
                break;
            case 500:
                title = errorMessageCenter.error.status500.title;
                break;
            default:
                title = errorMessageCenter.error.status500.title;
                break;
        }
    } 
    else if (err.title && !err.errors) {
        title = err.title;
    } 
    else {
        for (var errName in err.errors) {
            if (err.errors[errName].title) {
                title = err.errors[errName].title;
            }
        }
    }

    return title;
};

/**
 * Get the generic error message from error object
 */
exports.getGenericErrorMessage = function (err) {
    // holds the error message
    var message = '';

    // if there is an error code
    if (err.code) {
        switch (err.code) {
            case 200:
                message = errorMessageCenter.error.status200.message;
                break;
            case 400:
                message = errorMessageCenter.error.status400.message;
                break;
            case 401:
                message = errorMessageCenter.error.status401.message;
                break;
            case 403:
                message = errorMessageCenter.error.status403.message;
                break;
            case 404:
                message = errorMessageCenter.error.status404.message;
                break;
            case 500:
                message = errorMessageCenter.error.status500.message;
                break;
            case 11000:
                message = err.message;
                break;
            default:
                message = errorMessageCenter.error.status500.message;
                break;
        }
    } 
    // if there is just one error messsage
    else if (err.message && !err.errors) {
        message = err.message;
    } 
    // if there are mutliple errors
    else {
        for (var errName in err.errors) {
            if (err.errors[errName].message) {
                message = err.errors[errName].message;
            }
        }
    }

    return message;
};

/**
 * Get the detailed error message from error object
 */
exports.getDetailedErrorMessage = function (err) {
    // holds the error message
    var message = '';

    // if there is an error code
    if (err.code) {
        switch (err.code) {
            default:
                message = err.message;
                break;
        }
    } 
    // if there is just one error messsage
    else if (err.message && !err.errors) {
        message = err.message;
    } 
    // if there are mutliple errors
    else {
        for (var errName in err.errors) {
            if (err.errors[errName].message) {
                message = err.errors[errName].message;
            }
        }
    }

    return message;
};

/**
 * Save the error
 */
exports.logError = function(req, error) {
    // set error message
    const errorMessage = exports.getDetailedErrorMessage(error);

    // the date/time right now
    const rightNow = new Date().toLocaleString('en-us', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // the new error
    var newErrorObj = {
        'date': rightNow,
        'message': errorMessage,
        'stack': error.stack
    };

    // if there is a user
    if(req.user) {
        // find Error for user
        ErrorModel.findOne({ 'userId': req.user.id }, function(err, foundError) {
            // if error occurred
            if (err) {
                // log internal error
                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            }
            else if(foundError) {
                // holds the final dates
                var finalArray = foundError.userIssues;

                // push new error
                finalArray.push(newErrorObj);

                // update user
                foundError.update({ 'userIssues': finalArray }).exec(function(err) {
                    // if error occurred
                    if (err) {
                        // log internal error
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    }
                });
            }
            else {
                // create the error
                var newError = new ErrorModel({
                    'user': req.user.id,
                    'username': req.user.username,
                    'userIssues': [newErrorObj]
                });

                // save the user
                newError.save(function(err) {
                    // if error occurred
                    if (err) {
                        // log internal error
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    }
                });
            }
        });
    }
    else {
        // find Error for user
        ErrorModel.findOne({ 'userId': 'genericId' }, function(err, foundError) {
            // if error occurred
            if (err) {
                // log internal error
                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            }
            else if(foundError) {
                // holds the final dates
                var finalArray = foundError.userIssues;

                // push new error
                finalArray.push(newErrorObj);

                // update user
                foundError.update({ 'userIssues': finalArray }).exec(function(err) {
                    // if error occurred
                    if (err) {
                        // log internal error
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    }
                });
            }
            else {
                // create the error
                var newError = new ErrorModel({
                    'userId': 'genericId',
                    'username': 'genericId',
                    'userIssues': [newErrorObj]
                });

                // save the user
                newError.save(function(err) {
                    // if error occurred
                    if (err) {
                        // log internal error
                        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    }
                });
            }
        });
    }
};