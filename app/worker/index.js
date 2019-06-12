const newrelic = require('newrelic');
require('@newrelic/aws-sdk');

var AWS = require('aws-sdk');
var db = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

var workshopPrefix = process.env.WORKSHOP_PREFIX;
if (workshopPrefix === undefined) {
    workshopPrefix = '';
}

// Worker Lambda function listens to guestbook-parser queue
module.exports.handler = newrelic.setLambdaHandler((event, context, callback) => {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        if (record.messageAttributes.TraceContext != undefined) {
            var traceContext = record.messageAttributes.TraceContext.stringValue;
            var transaction = newrelic.getTransaction();
            transaction.acceptDistributedTracePayload(traceContext);
        }

        // Transform the message
        console.log('Worker received: ' + message);
        
        // Store message in DynamoDB
        var params = {
            TableName: workshopPrefix + 'GUESTBOOK_MESSAGES',
            Item: {
                'CHANNEL': {S: '1'},
                'MESSAGE': {S: message},
                'TIMESTAMP': {S: new Date().toISOString()}
            }
        };
        console.log('Worker saving to DynamoDB');
        db.putItem(params, function(err, data) {
            if (err) {
                console.log('Worker error', err);
            }
        });
  });

  return {};
});
