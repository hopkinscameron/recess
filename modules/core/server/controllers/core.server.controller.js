'use strict';

var // the path
    path = require('path'),
    // get the current config
	config = require(path.resolve('./config/config')),
    // the error handler
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc')),
    // the file system reader
    fs = require('fs'),
    // the ability to create requests/promises
    requestPromise = require('request-promise'),
    // for validators and sanitizers
    validator = require('validator'),
    // the path to the file details for this view
    coreDetailsPath = path.join(__dirname, '../data/core.json'),
    // the file details for this view
    coreDetails = {};

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
    // get the index file path
    var indexFilePath = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'developmentp' ? 'modules/core/server/index/index' : 'modules/core/server/views/index'

    // define the safe user object
    var safeUserObject = null;

    // if a user is logged in
    if (req.user) {
        // create the safe object
        safeUserObject = {
            email: validator.escape(req.user.email),
            created: req.user.created.toString(),
            displayName: validator.escape(req.user.displayName),
            firstName: validator.escape(req.user.firstName),
            lastName: validator.escape(req.user.lastName),
            roles: req.user.roles,
            lastLogin: req.user.lastLogin.toString(),
            membership: {
                tierId: typeof(req.user.tierId) === 'string' ? validator.escape(req.user.tierId) : req.user.tierId,
                subscribed: req.user.subscribed,
                billingCycle: req.user.billingCycle
            }
        };
    }

    // render the main index
    res.render(indexFilePath, {
        user: JSON.stringify(safeUserObject),
        sharedConfig: JSON.stringify(config.shared)
    });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
    res.status(500).render('modules/core/server/views/500', {
        error: 'Oops! Something went wrong...'
    });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {
    /*
    res.status(404).format({
    'text/html': function () {
            res.render('modules/core/server/views/404', {
            url: req.originalUrl
        });
    },
    'application/json': function () {
        res.json({
            error: 'Path not found'
        });
    },
    'default': function () {
            res.send('Path not found');
        }
    });*/
    
    // redirect to not found
    res.redirect('/not-found');
};

/**
 * Gets core data
 */
exports.getCoreData = function (req, res) {
    // send data
    res.json({ 'd': coreDetails });
};

/**
 * Shortens the URL
 */
exports.shortenUrl = function (req, res) {
    // validate existence
    req.checkBody('longUrl', 'Long url is required').notEmpty();

    // validate errors
    req.getValidationResult().then(function(errors) {
        // if any errors exists
        if(!errors.isEmpty()) {
            // holds all the errors in one text
            var errorText = "";

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
            // create request
            var options = {
                method: 'POST',
                uri: "https://www.googleapis.com/urlshortener/v1/url?key=" + config.googleShortenUrl.clientSecret,
                headers: {
                    'Content-Type': 'application/json; odata=verbose',
                    'Accept': 'application/json; odata=verbose'
                },
                body: {
                    "longUrl": req.body.longUrl
                },
                json: true
            };

            // submit request
            requestPromise(options).then(function (responseSU) {
                // create return response
                var returnReq = JSON.stringify({
                    "shortUrl": responseSU.id,
                    "longUrl": responseSU.longUrl
                });

                // send data
                res.json({ 'd': returnReq });
            }).catch(function (responseSU) {
                // send internal error
                res.status(500).send({ error: true, title: responseSU.error.code, message: responseSU.error.message  });
                console.log(clc.error(responseSU.error.message));
                errorHandler.logError(req, err);
            });
        }
    });
};

/**
 * Testing basic response
 */
exports.testBasicHelloWorld = function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World!");
};

/**
 * Read the DB middleware
 */
exports.readDB = function (req, res, next) {
    // check if file exists
    fs.stat(coreDetailsPath, function(err, stats) {
        // if the file exists
        if (stats.isFile()) {
            // read content
            fs.readFile(coreDetailsPath, 'utf8', (err, data) => {
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
                        coreDetails = JSON.parse(data);

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
            coreDetails = {};

            // go to next
            next();
        }
    });
};