"use strict";

var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('./utils').debug;

const TYPES = {
    "INTEGER" : parseInt,
    "PERCENT" : function(input) { return parseFloat(input).toFixed(2) + "%"},
    "DEFAULT" : function(input) { return input; }
};

class APIResponse
{
    constructor(client,response,reports)
    {
        this._client = client;
        this._response = response;
        this._requests = reports;

        this.each((report,request,index) => {
            debug(`"${request.name}" records`, report.data.rows.length);
        })
    }

    /**
     * Get the response reports.
     * @returns {Array}
     */
    get reports()
    {
        return this._response.reports;
    }

    /**
     * If the report has a nextPageToken, get the
     * paginated results and combine with this result set.
     * @returns {Promise}
     */
    getPagedResults()
    {
        let reportRequests = this.each((report,request) => {
            if (report.nextPageToken) {
                return request.clone(request.name+"-page-"+report.nextPageToken, {pageToken: report.nextPageToken});
            }
        });

        if (! reportRequests.length) return Promise.resolve(this);

        return this._client.getReports(reportRequests).then(response => {
            // merge the pagination data with this report.
            return this.mergeWith(response);
        });
    }

    /**
     * Merge the data from an incoming response with this response.
     * @param response APIResponse
     */
    mergeWith(response)
    {
        response.each((report,request,index) => {
            this.data(index).rows = _.concat(this.data(index).rows, report.data.rows);
        });
        return this;
    }

    /**
     * Get a report by it's index.
     * @param index Number
     * @returns {Object}
     */
    report(index)
    {
        return this.reports[index];
    }

    /**
     * Get the data object from the report response.
     * @param reportNumber Number
     * @returns {Array}
     */
    data(reportNumber)
    {
        return this.report(reportNumber).data;
    }

    /**
     * Call a function on each report.
     * @param callback function
     * @returns {Array}
     */
    each(callback)
    {
        return _.compact(this.reports.map((report,index) => {
            return callback(report,this._requests[index], index);
        }));
    }

    /**
     * Convert this response to a report array.
     * @returns {Array}
     */
    toJSON()
    {
        return this._reponse.reports;
    }

    /**
     * Return this response as JSON string.
     * @returns {String}
     */
    toString()
    {
        return JSON.stringify(this.toJSON(), null, " ");
    }

    /**
     * Parse the response as an array of records.
     * @returns {*|Array}
     */
    toArray()
    {
        return this.each((report,request,index) =>
        {
            let rows = report.data.rows;
            let dimensions = report.columnHeader.dimensions;
            let metrics = report.columnHeader.metricHeader.metricHeaderEntries;

            return rows.map(function(row,i)
            {
                let out = {};
                dimensions.forEach(function(dim,index) {
                    out[dim] = row.dimensions[index];
                });
                metrics.forEach(function(metric,index) {
                    if (! metric.type) metric.type = "DEFAULT";
                    let parse = TYPES[metric.type];
                    out[metric.name] = parse(row.metrics[0].values[index]);
                });
                return out;
            })
        });
    }
}

module.exports = APIResponse;