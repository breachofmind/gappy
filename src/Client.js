"use strict";

const google = require('googleapis');
const Promise = require('bluebird');
const _ = require('lodash');
const scopes = [
    "https://www.googleapis.com/auth/analytics.readonly"
];
const Report = require('./Report');
const APIResponse = require('./APIResponse');
var debug = require('./utils').debug;

class Client
{
    constructor(jwt, opts)
    {
        this._jwt = jwt;
        this._auth = new google.auth.JWT(jwt.client_email, null, jwt.private_key, scopes, null, null);
        this._api = google.analyticsreporting({version:'v4', auth: this._auth});
        this._reports = [];

        /**
         * Maximum number of API requests, just in case.
         * @type {number}
         */
        this.maxRequests = 10;

        /**
         * If true, returns the entire result set.
         * @type {boolean}
         */
        this.allResults = false;

        this._setOptions(opts);
    }

    _setOptions(opts)
    {
        Object.keys(opts).forEach(key => {
            this[key] = opts[key]
        });
    }

    /**
     * Add a report to the request.
     * @param report Report
     * @returns {Client}
     */
    add(report)
    {
        if (! (report instanceof Report)) {
            throw new TypeError("Argument needs to be a Report object");
        }
        this._reports.push(report);

        return this;
    }

    /**
     * Authorize using the json web token.
     * @returns {Promise}
     */
    authorize()
    {
        return new Promise((resolve,reject) => {
            this._auth.authorize((err,tokens) => {
                if (err) return reject(err);

                return resolve(tokens);
            })
        });
    }

    /**
     * Get the protected reports array.
     * @returns {Array}
     */
    get reports() {
        return this._reports;
    }

    /**
     * Query the API with the reports.
     * @returns {Promise}
     */
    get()
    {
        if (this.reports.length == 0) {
            throw new Error("No reports to submit");
        }
        return new Promise((resolve,reject) =>
        {
            this.authorize().then(tokens =>
            {
                this.getReports(this.reports).then(response => {
                    resolve(response);
                });
            })
        });
    }

    /**
     * Use the API to get the given reports.
     * @param reports array
     * @private
     */
    getReports(reports)
    {
        if (this.maxRequests <= 0) throw new Error("API maxRequests failsafe exceeded");

        this.maxRequests --;

        return new Promise((resolve,reject) =>
        {
            this._api.reports.batchGet({
                auth: this._auth,
                resource: {
                    reportRequests: reports.map((report => {
                        debug('Requesting', report.name);
                        return report.toJSON();
                    }))
                }
            }, (err,data) => {
                if (err) return reject(err);

                this._processResponse(data,reports).then(response => {
                    return resolve(response);
                })
            })
        });
    }

    /**
     * Process the incoming response.
     * @param data Object
     * @param reports Array
     * @returns {Promise.<APIResponse>}
     * @private
     */
    _processResponse(data,reports)
    {
        let response = new APIResponse(this,data,reports);

        if (this.allResults === false) return Promise.resolve(response);

        // Check for pagination tokens.
        // If they exist, create a copy of the report with the page token
        // and append the data to the original request.
        return response.getPagedResults();
    }
}

module.exports = Client;