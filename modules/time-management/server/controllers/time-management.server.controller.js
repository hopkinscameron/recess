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
    // lodash
    _ = require('lodash'),
    // the file system reader
    fs = require('fs'),
    // the path to the file details for this view
    timeManagementDetailsPath = path.join(__dirname, '../data/time-management.json'),
    // the file details for this view
    timeManagementDetails = {},
    // mongoose
    mongoose = require('mongoose'),
    // the TimeManagement model
    TimeManagement = mongoose.model('TimeManagement'),
    // the User model
    User = mongoose.model('User');

/**
 * Get the time off
 */
exports.getTimeOff = function (req, res) {
    // find time management for user
    TimeManagement.findOne({ 'user': req.user }, function(err, foundTimeManagement) {
        // if error occurred
        if (err) {
            // send internal error
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            errorHandler.logError(req, err);
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
            const e = { title: errorHandler.getErrorTitle({ code: 400 }), message: errorText };
            res.status(400).send(e);
            errorHandler.logError(req, e);
        }
        else {
            // set the date and reason
            const date = req.body.date;
            const reason = req.body.reason;

            // find time management for user
            TimeManagement.findOne({ 'user': req.user }, function(err, foundTimeManagement) {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else if(foundTimeManagement) {
                    // determines if should update
                    var shouldUpdate = true;

                    // holds the final dates
                    var finalDatesValue = foundTimeManagement.dates;

                    // check if this date already exists
                    var dateIndex = _.findIndex(finalDatesValue, { 'date': date });

                    // if date exists
                    if(dateIndex != -1) {
                        var dateFound = finalDatesValue[dateIndex];
                        var typeIndex = _.indexOf(dateFound.types, reason);

                        // if found dont update
                        if(typeIndex != -1) {
                            shouldUpdate = false;
                        }
                        else {
                            dateFound.types.push(reason);
                            finalDatesValue[dateIndex] = dateFound;
                        }
                    }
                    else {
                        // create new date and add
                        var newDate = {
                            'date': date,
                            'types': [reason]
                        };
                        finalDatesValue.push(newDate);
                    }

                    // if we should update
                    if(shouldUpdate) {
                        // update user
                        foundTimeManagement.update({ 'dates': finalDatesValue }).exec(function(err) {
                            // if error occurred
                            if (err) {
                                // send internal error
                                res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                                errorHandler.logError(req, err);
                            }
                            else {
                                // send success
                                res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Addition successful!' });
                            }
                        });
                    }
                    else {
                        // send error
                        res.status(200).send({ error: true, title: errorHandler.getErrorTitle({ code: 200 }), message: `${reason} type already exists for this date ${date}` });
                    }
                }
                else {
                    // create the time management
                    var newTM = new TimeManagement({
                        'user': req.user,
                        'dates': [
                            {
                                'date': date,
                                'types': [reason]
                            }
                        ]
                    });

                    // save the tm
                    newTM.save(function(err) {
                        // if error occurred
                        if (err) {
                            // send internal error
                            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                            errorHandler.logError(req, err);
                        }
                        else {
                            // send success
                            res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Addition successful!' });
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
    req.checkBody('date', 'Date is required in the format of \'yyyy-mm-dd\'.').notEmpty();
    req.checkBody('date', 'Date provided is not a date. Date must be in the format of \'yyyy-mm-dd\'').isDate();
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
            const e = { title: errorHandler.getErrorTitle({ code: 400 }), message: errorText };
            res.status(400).send(e);
            errorHandler.logError(req, e);
        }
        else {
            // set the date
            const date = req.body.date;
            const reason = req.body.reason;

            // find time management for user
            TimeManagement.findOne({ 'user': req.user }, function(err, foundTimeManagement) {
                // if error occurred
                if (err) {
                    // send internal error
                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                    errorHandler.logError(req, err);
                }
                else if(foundTimeManagement) {
                    // determines if should update
                    var shouldUpdate = true;

                    // check if this date already exists
                    var dateIndex = _.findIndex(foundTimeManagement.dates, { 'date': date });
                    
                    // if date exists
                    if(dateIndex != -1) {
                        var finalDatesValue = foundTimeManagement.dates;
                        var dateFound = finalDatesValue[dateIndex];
                        var typeIndex = _.indexOf(dateFound.types, reason);     

                        // if not found dont update
                        if(typeIndex == -1) {
                            shouldUpdate = false;
                        }
                        else {
                            // remove at index
                            dateFound.types.splice(typeIndex, 1);

                            // if there are none left, delete
                            dateFound.types.length > 0 ? finalDatesValue[dateIndex] = dateFound : finalDatesValue.splice(dateIndex, 1);
                        }

                        // if we should update
                        if(shouldUpdate) {
                            // update user
                            foundTimeManagement.update({ 'dates': finalDatesValue }).exec(function(err) {
                                // if error occurred
                                if (err) {
                                    // send internal error
                                    res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
                                    console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                                    errorHandler.logError(req, err);
                                }
                                else {
                                    // send success
                                    res.status(200).send({ title: errorHandler.getErrorTitle({ code: 200 }), message: 'Removal successful!' });
                                }
                            });
                        }
                        else {
                            // send error
                            res.status(200).send({ error: true, title: errorHandler.getErrorTitle({ code: 200 }), message: `${reason} type does not exists for this date ${date}` });
                        }
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
 * Get's all users and their time off for today
 */
exports.getUsersTimeOff = function (req, res) {
    // get all time
    User.find({ }, function(err, foundUsers) {
        // if error occurred
        if (err) {
            // send internal error
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            errorHandler.logError(req, err);
        }
        else {
            // get all users time management
            var allUsers = getAllUsersTimeManagement(req, res, foundUsers);
        }
    });
};

/**
 * Get's all users and their time off for today
 */
exports.getUsersTimeOffToday = function (req, res) {
    // get all time
    User.find({ }, function(err, foundUsers) {
        // if error occurred
        if (err) {
            // send internal error
            res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
            console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
            errorHandler.logError(req, err);
        }
        else {
            // get all users time management
            var allUsers = getAllUsersTimeManagement(req, res, foundUsers, true);
        }
    });
};

/**
 * Get the time off types
 */
exports.getTimeOffTypes = function (req, res) {
    // get time management types
    TimeManagement.getTimeOffTypes().then(function (response) {
        // send data
        res.json({ 'd': response });
    })
    .catch(function (err) {
        // send internal error
        res.status(500).send({ error: true, title: errorHandler.getErrorTitle(err), message: errorHandler.getGenericErrorMessage(err) });
        console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
        errorHandler.logError(req, err);
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
                    errorHandler.logError(req, err);
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
                        errorHandler.logError(req, err);
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

// gets all Users Time Management
async function getAllUsersTimeManagement(req, res, users, todayOnly) {
    // holds the new users data
    var newUsers = [];

    // go through each user
    for(const user of users) {
        // if only today
        if(todayOnly) {
            // holds the final user object
            var newUser = {
                'fullName': user.displayName,
                'types': []
            };
            newUser.types = await getUserTimeManagement(user, todayOnly);
            newUsers.push(newUser);
        }
        else {
            // holds the final user object
            var newUser = {
                'fullName': user.displayName,
                'dates': []
            };
            newUser.dates = await getUserTimeManagement(user);
            newUsers.push(newUser);
        }
    };

    // send data
    res.json({ 'd': newUsers });
};

// gets User's Time Management
function getUserTimeManagement(user, todayOnly) {
    return new Promise(resolve => {
        // find time management for user
        TimeManagement.findOne({ 'user': user }, function(err, foundTimeManagement) {
            // if error occurred
            if (err) {
                // send internal error
                console.log(clc.error(errorHandler.getDetailedErrorMessage(err)));
                errorHandler.logError(req, err);
                reject(`Could not get ${user.username}'s time management`);
            }
            else if(foundTimeManagement) {
                // if today only
                if(todayOnly) {
                    const userDates = _.cloneDeep(foundTimeManagement.dates);

                    // format date to agenda date (2018-01-17)
                    var today = new Date();
                    var dateString = today.toLocaleDateString('en-us', { day: 'numeric', month: 'numeric', year: 'numeric' });
                    var split = dateString.split('/');
                    split[0] = split[0] < 10 ? '0' + split[0] : split[0];
                    dateString = `${split[2]}-${split[0]}-${split[1]}`;

                    var todayDateTypes = _.find(userDates, { 'date': dateString });
                    resolve(todayDateTypes ? todayDateTypes.types : []);
                }
                else {
                    var dates = [];
                    _.forEach(foundTimeManagement.dates, function(value) {
                        dates.push({ 'date': value.date, 'types': value.types });
                    });

                    resolve(dates);
                }
            }
            else {
                resolve({});
            }
        });
    });
};