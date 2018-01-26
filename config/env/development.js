'use strict';

/**
 * Module dependencies.
 */
var // the default environment configuration
    defaultEnvConfig = require('./default');

module.exports = {
    db: {
        uri: process.env.MLAB_MONGODB_DEV || 'mongodb://localhost:27017/recessDev',
        options: {
            user: '',
            pass: '',
            db: { 
                native_parser: true 
            },
            poolSize: 5
        },
        // Enable mongoose debug mode
        debug: process.env.MONGODB_DEBUG || false
    },
    livereload: false,
    log: {
        // logging with Morgan - https://github.com/expressjs/morgan
        // can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
        format: 'dev',
        fileLogger: {
            directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
            fileName: process.env.LOG_FILE || 'app.log',
            maxsize: 10485760,
            maxFiles: 2,
            json: false
        }
    },
    mailer: {
        from: process.env.MAILER_FROM || 'MAILER_FROM',
        to: process.env.MAILER_CONTACT_TO || 'MAILER_TO',
        options: {
            host: process.env.MAILER_HOST || 'MAILER_HOST',
            service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
            auth: {
                user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
                pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
            }
        }
    },
    google: {
        shortenUrl: {
            clientSecret: process.env.GOOGLE_SHORTEN_URL_API_KEY
        },
        sendEmail: {
            clientSecret: process.env.GOOGLE_SEND_EMAIL_SCRIPT_KEY
        },
        mapsJavascript: {
            clientSecret: process.env.GOOGLE_MAPS_JAVASCRIPT_API_KEY
        }
    },
    seedDB: {
        seed: process.env.MONGO_SEED === 'true',
        options: {
            logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false'
        },
        // Order of collections in configuration will determine order of seeding.
        // i.e. given these settings, the User seeds will be complete before
        // any other seed is performed.
        collections: [
            {
                model: 'User',
                docs: 
                [
                    {
                        overwrite: false,
                        data: {
                            username: 'local-admin',
                            email: 'admin@localhost.com',
                            firstName: 'Admin',
                            lastName: 'Local',
                            roles: ['user', 'admin']
                        }
                    }, 
                    {
                        // Set to true to overwrite this document
                        // when it already exists in the collection.
                        // If set to false, or missing, the seed operation
                        // will skip this document to avoid overwriting it.
                        overwrite: false,
                        data: {
                            username: 'local-user',
                            email: 'user@localhost.com',
                            firstName: 'User',
                            lastName: 'Local',
                            roles: ['user']
                        }
                    }       
                ]
            },
            {
                model: 'TimeManagement',
                options: {
                    // Override log results setting at the
                    // collection level.
                    logResults: true
                },
                skip: {
                    // Skip collection when this query returns results.
                    // e.g. {}: Only seeds collection when it is empty.
                    when: {} // Mongoose qualified query
                },
                docs: [
                    {
                        data: {
                            dates: { 
                                '2018-01-01': 'WFH',
                                '2018-01-02': 'On Vacation',
                                '2018-01-03': 'On Vacation',
                                '2018-01-04': 'Out Sick',
                                '2018-01-16': 'In Late',
                                '2018-01-18': 'WFH',
                                '2018-01-19': 'Out Early',
                                '2018-01-24': 'Out Sick',
                                '2018-01-30': 'In Late',
                                '2018-01-31': 'Out Early'
                            }
                        }
                    }
                ]
            }
        ]
    }
};