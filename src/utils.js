"use strict";

var colors = require('colors/safe');

exports.debug = function(message, value)
{
    console.log(message + ": "+colors.cyan(value));
};