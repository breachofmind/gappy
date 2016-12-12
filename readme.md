#Gappy for node.js
Happy Google Analytics utility. Just provide your JWT, build your reports, and enjoy the response you receive.

## Installing
```bash
npm install breachofmind/gappy
```
Or, if you're cool:
```bash
yarn add breachofmind/gappy
```

## Usage
### Fire and Forget approach
```javascript
var gappy = require('gappy');

var options = {
    allResults: true,
    maxRequests: 10
};

gappy(require('./path/to/jwt.json'), options, function(Report) {

    return 

}).then(gappy.toCSV).then(gappy.toColumns);
```

### Anal approach
```javascript
var gappy = require('gappy');

var options = {
    allResults: true,
    maxRequests: 10
};

var client = new gappy.Client(require('./path/to/jwt.json'));
var report = new gappy.Report("myFunReport", require('./path/to/report.json'));

client.add(report);

client.get().then(function(response) {
    // Do stuff!
    response.each(function(report,request,index) {
        // Whatever!
    })
});

// You could just pipe the response to the CSV generator.
client.get().then(gappy.toCSV);
```

### Report Builder
Creating reports in Analytics V4 API is a pain. Gappy makes it easier.
```javascript
var gappy = require('gappy');

const VIEW_ID = "12345678"; // From your GA account

var report = new gappy.Report('cityReport', VIEW_ID)
    .date("2016-10-01", new Date())
    .limit(20)
    .metric("sessions", "integer") // What??? no need for "ga:" ???
    .metric("bounceRate")
    .dimension("city")
    .dimension("country")
    .addTo(client);

// Clone an existing report to change stuff.
var cloned = report.clone('cityCloned').date('2015-10-01','2016-10-01',0);

```

### Options
- `allResults` : Return the entire dataset if it is paginated. If your resultset has more than 10,000 records, 
it will keep querying until all the data is returned. Be careful with this one...
- `maxRequests` : Total number of requests to the API before stopping. Good if you are wary about querying the API
too much for big data dumps.