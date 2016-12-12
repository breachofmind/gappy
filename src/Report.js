"use strict";

var isArray = Array.isArray;
var moment = require('moment');
var _ = require('lodash');

const GA_NAMESPACE = "ga:";

/**
 * Report building class.
 * @author Mike Adamczyk <mike@bom.us>
 */
class Report
{
    /**
     * Create a new report.
     * @param name string
     * @param view string|Object can be viewId or json report Object
     */
    constructor(name, view)
    {
        this.name = name;

        this._report = {
            viewId: undefined,
            dateRanges: [],
            metrics: [],
            dimensions: []
        };

        if (typeof view == 'string') {
            this.view(view);
        } else if (typeof view == 'object') {
            this.json(view);
        }
    }

    /**
     * Limit the returning row count.
     * @param size Number
     * @returns {Report}
     */
    limit(size)
    {
        return this.set('pageSize', parseInt(size));
    }

    /**
     * Set a value on the report object.
     * @param key srting
     * @param value mixed
     * @returns {Report}
     */
    set(key,value,index=null)
    {
        let type = this._report[key];
        if (isArray(type)) {
            if (index) {
                this._report[key][index] = value;
            } else {
                this._report[key].push(value);
            }
        } else {
            this._report[key] = value;
        }

        return this;
    }

    /**
     * Add a report json.
     * @param json object
     * @returns {Report}
     */
    json(json)
    {
        if (typeof json == 'object') {
            this._report = json;
        }
        return this;
    }

    /**
     * Change the View ID.
     * @param id string
     * @returns {Report}
     */
    view(id)
    {
        return this.set('viewId', id);
    }

    /**
     * Set a start and end date range.
     * @param start string|Date
     * @param end string|Date
     * @param index Number (optional)
     * @returns {Report}
     */
    date(start,end, index=null)
    {
        if (start instanceof Date) start = moment(start).format('YYYY-MM-DD');
        if (end instanceof Date) end = moment(end).format('YYYY-MM-DD');
        let dateRange = {startDate:start, endDate:end};
        return this.set('dateRanges', dateRange, index)
    }

    /**
     * Add a metric.
     * @param expression string
     * @param formattingType string
     * @returns {Report}
     */
    metric(expression, formattingType)
    {
        let metric = {expression: prependIfMissing(GA_NAMESPACE,expression)};
        if (formattingType) metric.formattingType = formattingType.toUpperCase();

        return this.set('metrics', metric);
    }

    /**
     * Add a dimension.
     * @param name string
     * @returns {Report}
     */
    dimension(name)
    {
        return this.set('dimensions', {name: prependIfMissing(GA_NAMESPACE, name)});
    }

    /**
     * Convert the report to a JSON object.
     * @returns {{viewId: *, dateRanges: Array, metrics: Array, dimensions: Array}|*}
     */
    toJSON()
    {
        return this._report;
    }

    /**
     * Return the report to an object.
     * @returns {{viewId: *, dateRanges: Array, metrics: Array, dimensions: Array}|*}
     */
    toValue()
    {
        return this.toJSON();
    }

    /**
     * Convert the report to a JSON string.
     * @returns {String}
     */
    toString()
    {
        return JSON.stringify(this.toJSON(), null, "  ");
    }

    /**
     * Create a clone of this report with new properties.
     * @param newName string
     * @returns {Report}
     */
    clone(newName,merge)
    {
        let cloned = _.clone(this.toJSON());
        cloned = _.merge(merge,cloned);

        return new Report(newName,cloned);
    }

    /**
     * Add to the Client instance.
     * @param client Client
     * @returns {Report}
     */
    addTo(client)
    {
        client.add(this);
        return this;
    }

    /**
     * Create a new report.
     * Named constructor
     * @param name String
     * @param view string|Object
     * @returns {Report}
     */
    static create(name,view)
    {
        return new Report(name,view);
    }
}

/**
 * Prepend a string to another string if it is missing.
 * @param what string
 * @param to string
 * @returns {String}
 */
function prependIfMissing(what,to)
{
    if (! to.startsWith(what)) {
        return what + to;
    }
    return to;
}

module.exports = Report;