'use strict';

/**
 * Module dependencies.
 */
var // the application configuration
    config = require('../config'),
    // mongoose
    mongoose = require('mongoose'),
    // lodash
    _ = require('lodash'),
    // clc colors for console logging
    clc = require('./clc');

exports.start = start;

// starts the seeding
function start(seedConfig) {
    return new Promise(function (resolve, reject) {
        // if config
        seedConfig = seedConfig || {};

        // get the options and collections
        var options = seedConfig.options || (config.seedDB ? _.clone(config.seedDB.options, true) : {});
        var collections = seedConfig.collections || (config.seedDB ? _.clone(config.seedDB.collections, true) : []);

        // if no collections, return
        if (!collections.length) {
            return resolve();
        }

        // get seeds from collection model
        var seeds = collections.filter(function (collection) {
            return collection.model;
        });

        // use the reduction pattern to ensure we process seeding in desierror order.
        seeds.reduce(function (p, item) {
            return p.then(function () {
                return seed(item, options);
            });
        }, Promise.resolve()) // start with resolved promise for initial previous (p) item
        .then(onSuccessComplete)
        .catch(onError);

        // Local Promise handlers
        // on success complete
        function onSuccessComplete() {
            // log results
            if (options.logResults) {
                console.log();
                console.log(clc.success('Database Seeding: Mongo Seed complete!'));
                console.log();
            }

            return resolve();
        };

        // on error
        function onError(err) {
            // log results
            if (options.logResults) {
                console.log();
                console.log(clc.error('Database Seeding: Mongo Seed Failed!'));
                console.log(clc.error('Database Seeding: ' + err));
                console.log();
            }

            return reject(err);
        };
    });
};

// seeds the collection
function seed(collection, options) {
    // merge options with collection options
    options = _.merge(options || {}, collection.options || {});

    return new Promise(function (resolve, reject) {
        // get the model and docs
        const Model = mongoose.model(collection.model);
        const docs = collection.docs;

        // get skip whens
        var skipWhen = collection.skip ? collection.skip.when : null;

        // if no seed
        if (!Model.seed) {
            return reject(new Error('Database Seeding: Invalid Model Configuration - ' + collection.model + '.seed() not implemented'));
        }

        // if no docs
        if (!docs || !docs.length) {
            return resolve();
        }

        // First check if we should skip this collection
        // based on the collection's "skip.when" option.
        // NOTE: If it exists, "skip.when" should be a qualified
        // Mongoose query that will be used with Model.find().
        skipCollection().then(seedDocuments).then(function () {
            return resolve();
        })
        .catch(function (err) {
            return reject(err);
        });

        // skips collection
        function skipCollection() {
            return new Promise(function (resolve, reject) {
                // if not skipping
                if (!skipWhen) {
                    return resolve(false);
                }

                // find the skip pattern
                Model.find(skipWhen).exec(function (err, results) {
                    // if error
                    if (err) {
                        return reject(err);
                    }

                    // if results, return true
                    if (results && results.length) {
                        return resolve(true);
                    }

                    return resolve(false);
                });
            });
        };

        // seeds documents
        function seedDocuments(skipCollection) {
            return new Promise(function (resolve, reject) {
                // if skipping
                if (skipCollection) {
                    return onComplete([{ message: clc.info('Database Seeding: ' + collection.model + ' collection skipped') }]);
                }

                // get the workload
                var workload = docs.filter(function (doc) {
                    return doc.data;
                })
                .map(function (doc) {
                    return Model.seed(doc.data, { overwrite: doc.overwrite });
                });

                // set a promise on all the workloads for seeding
                Promise.all(workload).then(onComplete).catch(onError);

                // Local Closures
                // on complete
                function onComplete(responses) {
                    // if logging results
                    if (options.logResults) {
                        // for each response, log
                        responses.forEach(function (response) {
                            // log response
                            if (response.message) {
                                console.log(clc.info(response.message));
                            }
                        });
                    }

                    return resolve();
                };

                // on error
                function onError(err) {
                    return reject(err);
                };
            });
        };
    });
};