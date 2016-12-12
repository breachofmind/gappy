var gappy = require('../index');

gappy(require('../demo/brightstar-jwt.json'), {allResults:true}, function(Report) {

    return new Report("cities",require('../demo/report.json'));

}).then(gappy.toCSV).then(gappy.toColumns);