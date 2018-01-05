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
    // lodash
    _ = require('lodash'),
    // the file system reader
    fs = require('fs'),
    // the path to the file details for this view
    timeManagementDetailsPath = path.join(__dirname, '../data/time-management.json'),
    // the file details for this view
    timeManagementDetails = {},
    // short id generator
    shortid = require('shortid'),
    // the time management model
    TimeManagement = require(path.resolve('./modules/time-management/server/models/model-time-management'));

/**
 * Get the time off
 */
exports.getTimeOff = function (req, res) {
    // find time management for user
    TimeManagement.findOne({ 'userId': req.user._id }, function(err, foundTimeManagement) {
        // if error occurred
        if (err) {
            // send internal error
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
        }
        else {
            // send data
            res.json({ 'd': foundTimeManagement ? foundTimeManagement.dates : [] });
        }
    });
};

/**
 * Add time off
 */
exports.addTimeOff = function (req, res) {
    // validate existence
    req.checkBody('date', 'Date is required.').notEmpty();
    req.checkBody('date', 'Date provided is not a date.').isDate();
    req.checkBody('reason', 'Reason is required.').notEmpty();
    req.checkBody('reason', 'Reason must be a string.').isString();

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
            // find time management for user
            TimeManagement.findOne({ 'userId': req.user._id }, function(err, foundTimeManagement) {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                }
                else if(foundTimeManagement) {
                    // check if this date already exists
                    var pos = _.findIndex(foundTimeManagement.dates, { 'time': new Date(req.body.date).getTime() });

                    // if date exists
                    if(pos != -1) {
                        // update the reason
                        foundTimeManagement.dates[pos].reason = req.body.reason;

                        // update the values
                        TimeManagement.update(foundTimeManagement, { 'dates': foundTimeManagement.dates }, function(err, updatedTimeManagement) {
                            // if an error occurred
                            if (err) {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            }
                            else if (updatedTimeManagement) {
                                // send success
                                res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Addition successful!' });
                            }
                            else {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                                console.log(clc.error(`In ${path.basename(__filename)} \'deleteTimeOff\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t update time off.'));
                            }
                        });
                    }
                    else {
                        // the new time management
                        var newTM = {
                            'date': formatDate(req.body.date),
                            'time': new Date(req.body.date).getTime(),
                            'reason': req.body.reason
                        };

                        // update 
                        foundTimeManagement.dates.splice(_.sortedIndexBy(foundTimeManagement.dates, newTM, 'date'), 0, newTM);

                        // update the values
                        TimeManagement.update(foundTimeManagement, { 'dates': foundTimeManagement.dates }, function(err, updatedTimeManagement) {
                            // if an error occurred
                            if (err) {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            }
                            else if (updatedTimeManagement) {
                                // send success
                                res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Addition successful!' });
                            }
                            else {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                                console.log(clc.error(`In ${path.basename(__filename)} \'deleteTimeOff\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t update time off.'));
                            }
                        });
                    }
                }
                else {
                    // create the time management
                    var tm = {
                        'userId': req.user._id,
                        'dates': [{
                            'date': formatDate(req.body.date),
                            'time': new Date(req.body.date).getTime(),
                            'reason': req.body.reason
                        }]
                    };

                    // save the time management
                    TimeManagement.save(tm, function(err, newSavedTM) {
                        // if error occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                        }
                        else if(newSavedTM) {
                            // send success
                            res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Addition successful!' });
                        }
                        else {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                            console.log(clc.error(`In ${path.basename(__filename)} \'addTimeOff\': ` + errorHandler.getDetailedErrorMessage({ code: 500 }) + ' Couldn\'t save time management.'));
                        }
                    });
                }
            });
        }
    });
};

/**
 * Delete time off
 */
exports.deleteTimeOff = function (req, res) {
    // validate existence
    req.checkBody('date', 'Date is required.').notEmpty();
    req.checkBody('date', 'Date provided is not a date.').isDate();

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
            // find time management for user
            TimeManagement.findOne({ 'userId': req.user._id }, function(err, foundTimeManagement) {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                }
                else if(foundTimeManagement) {
                    // check if this date already exists
                    var pos = _.findIndex(foundTimeManagement.dates, { 'time': new Date(req.body.date).getTime() });
                    
                    // if date exists
                    if(pos != -1) {
                        // remove position
                        foundTimeManagement.dates.splice(pos, 1);

                        // update the values
                        TimeManagement.update(foundTimeManagement, { 'dates': foundTimeManagement.dates }, function(err, updatedTimeManagement) {
                            // if an error occurred
                            if (err) {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            }
                            else if (updatedTimeManagement) {
                                // send success
                                res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Deletion successful!' });
                            }
                            else {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle({ code: 500 }), message: errorHandler.getGenericErrorMessage({ code: 500 }) });
                                console.log(clc.error(`In ${path.basename(__filename)} \'deleteTimeOff\': ` + errorHandler.getGenericErrorMessage({ code: 500 }) + ' Couldn\'t update time off.'));
                            }
                        });
                    }
                    else {
                        // send success
                        res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Nothing to delete!' });
                    }
                }
                else {
                    // send success
                    res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Nothing to delete!' });
                }
            });
        }
    });
};

/**
 * Read the DB middleware
 */
exports.readDB = function (req, res, next) {
    // check if file exists
    fs.stat(timeManagementDetailsPath, function(err, stats) {
        // if the file exists
        if (stats.isFile()) {
            // read content
            fs.readFile(timeManagementDetailsPath, 'utf8', (err, data) => {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                }
                else {
                    try {
                        // read content
                        timeManagementDetails = JSON.parse(data);

                        // go to next
                        next();
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
            timeManagementDetails = {};

            // go to next
            next();
        }
    });
};

// formate date
function formatDate(dateToFormat) {
    try {
        // get the date to format
        var date = new Date(dateToFormat);

        return date.toLocaleString('en-us', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    catch (e) {
        return dateToFormat;
    }
};