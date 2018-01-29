'use strict';

/**
 * Module dependencies.
 */
var // the application configuration
    config = require('../config'),
    // clc colors for console logging
    clc = require('./clc'),
    // path
    path = require('path'),
    // mongoose
    mongoose = require('mongoose');

/**
 * Load the mongoose models
 * @param {*} callback 
 */
module.exports.loadModels = function (callback) {
    // globbing model files
    config.files.server.models.forEach(function (modelPath) {
        require(path.resolve(modelPath));
    });

    // if callback
    if (callback) {
        callback();
    }
};

/**
 * Initialize Mongoose
 */
module.exports.connect = function (callback) {
    console.log('----- ');
    console.log('----- ' + clc.info('Initializing Mongodb'));
    console.log('----- ');

    // setup the mongoose promise
    mongoose.Promise = config.db.promise;

    /*
    // set up the mongoose db connection
    mongoose.connect(config.db.uri, config.db.options);
    var db = mongoose.connection;

    // on error
    db.on('error', function (err) {
        console.error(clc.error('Could not connect to MongoDB!'));
        console.log(clc.error(err));

        // exit from the application
        process.exit();
    });

    // on mongo connection
    db.once('open', function () {
        // Enabling mongoose debug mode if required
        mongoose.set('debug', config.db.debug);

        // if a callback
        if (callback) {
            callback(db);
        }

        console.log('----- ');
        console.log('----- ' + clc.success('Done Initializing Mongodb'));
        console.log('----- ');
    });
    */
    
    // connect to mongodb
    var db = mongoose.connect(config.db.uri, config.db.options, function (err) {
        // log error
        if (err) {
            console.error(clc.error('Could not connect to MongoDB!'));
            console.log(clc.error(err));

            // exit from the application
            process.exit();
        } 
        else {
            // Enabling mongoose debug mode if required
            mongoose.set('debug', config.db.debug);

            console.log('----- ');
            console.log('----- ' + clc.success('Done Initializing Mongodb'));
            console.log('----- ');

            // if a callback
            if (callback) {
                callback(db);
            }
        }
    });
};

/**
 * Disconnect from mongo
 * @param {*} callback 
 */
module.exports.disconnect = function (callback) {
    mongoose.disconnect(function (err) {
        console.info(clc.warn('Disconnected from MongoDB.'));
        callback(err);
    });
};
