'use strict';

/**
 *  Name: The Error Schema
    Description: Determines how a Error is defined
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
    // clc for console logging
    clc = require(path.resolve('./config/lib/clc'));

/**
 * Error Schema
 */ 
var ErrorSchema = new Schema ({
    created: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: String,
        required: [true, 'User id is required']
    },
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    userIssues: {
        type: [{
            date: String,
            message: String,
            stack: String
        }],
        default: new Array()
    }
});

// specify the transform schema option
if (!ErrorSchema.options.toObject) {
    ErrorSchema.options.toObject = {};
}

/**
 * Create instance method to return an object
 */
ErrorSchema.options.toObject.transform = function (doc, ret, options) {
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

// model this Schema
mongoose.model('ErrorModel', ErrorSchema);