const newrelic = require('newrelic');
require('@newrelic/aws-sdk');

var AWS = require('aws-sdk');
var sqs = new AWS.SQS({
    region: process.env.AWS_REGION
});

var workshopPrefix = process.env.WORKSHOP_PREFIX;
if (workshopPrefix === undefined) {
    workshopPrefix = '';
}

// Parser Lambda function listens to guestbook-frontend queue
module.exports.handler = newrelic.setLambdaHandler((event, context, callback) => {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        var transaction = newrelic.getTransaction();
        var traceContext = '';
        if (record.messageAttributes.TraceContext != undefined) {
            traceContext = record.messageAttributes.TraceContext.stringValue;    
            transaction.acceptDistributedTracePayload(traceContext);
        }
        var payload = transaction.createDistributedTracePayload();

        // Transform the message
        console.log('Parser received: ' + message);
        message = message.toUpperCase();

        // Send this message to SQS guestbook-parser
        var accountId = context.invokedFunctionArn.split(":")[4];
        var queueUrl = 'https://sqs.' + process.env.AWS_REGION + '.amazonaws.com/' + accountId + '/' + workshopPrefix + 'guestbook-parser';
        var params = {
            MessageBody: message,
            QueueUrl: queueUrl,
            MessageAttributes: {
                TraceContext:  {
                    DataType: 'String',
                    StringValue: payload.text()
                }
            }
        };

        console.log('Parser pushing to queue: ' + message);
        //newrelic.addCustomAttribute('msgData', message);
        sqs.sendMessage(params, function(err, data) {
            if (err) {
                console.log('Parser error sending to queue: ', err);
            }
            var response = {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: 'Message sent'
            };
            callback(null, response);
        });
    });
});
