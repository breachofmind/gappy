var Client      = require('./src/Client');
var Report      = require('./src/Report');
var moment      = require('moment');
var colors      = require('colors/safe');
var columnify   = require('columnify');
var json2csv    = require('json2csv');
var fs          = require('fs');
var debug       = require('./src/utils').debug;

/**
 * Gappy easy-constructor function.
 * @param jwt Object
 * @param opts Object
 * @param callback Function - returns array Report objects
 * @returns {Promise}
 */
function gappy(jwt, opts={}, callback)
{
    var client = new Client(jwt,opts);

    var reports = callback(Report,client);
    if (! Array.isArray(reports)) reports = [reports];

    reports.forEach(report => {
        client.add(report);
    });

    return client.get();
}

/**
 * Gappy Client class.
 * @type {Client}
 */
gappy.Client = Client;

/**
 * Gappy Report class.
 * @type {Report}
 */
gappy.Report = Report;

/**
 * Convert a response to CSV files.
 * @param response APIResponse
 */
gappy.toCSV = function(response)
{
    let result = json2csv({data: response.toArray() });

    response.each((report,request,index) =>
    {
        let filename = request.name + ".csv";

        fs.writeFileSync(filename, result[index]);

        debug('Write', filename);
    });

    return response;
};

/**
 * Convert each report to a column view.
 * @param response
 * @returns {*}
 */
gappy.toColumns = function(response)
{
    let result = response.toArray();

    response.each((report,request,index) =>
    {
        console.log("Report: "+colors.cyan(request.name));
        console.log(columnify(result[index]))
    });

    return response;
};

module.exports = gappy;