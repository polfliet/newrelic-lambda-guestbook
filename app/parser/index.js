const newrelic = require('newrelic');
require('@newrelic/aws-sdk');

var AWS = require('aws-sdk');
var sqs = new AWS.SQS({
    region: 'eu-west-1'
});

// Parser Lambda function listens to guestbook-frontend queue
module.exports.handler = newrelic.setLambdaHandler((event, context, callback) => {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        var traceContext = '';
        if (record.messageAttributes.TraceContext != undefined) {
            traceContext = record.messageAttributes.TraceContext.stringValue;
            var transaction = newrelic.getTransaction();
            transaction.acceptDistributedTracePayload(traceContext);
        }

        // Transform the message
        console.log('Parser received: ' + message);
        message = message.toUpperCase();

        // Send this message to SQS guestbook-parser
        var accountId = context.invokedFunctionArn.split(":")[4];
        var queueUrl = 'https://sqs.eu-west-1.amazonaws.com/' + accountId + '/guestbook-parser';
        var params = {
            MessageBody: message,
            QueueUrl: queueUrl,
            MessageAttributes: {
                TraceContext:  {
                    DataType: 'String',
                    StringValue: traceContext
                }
            }
        };

        console.log('Parser pushing to queue: ' + message);
        //newrelic.recordCustomEvent(‘GuestbookData’, {message: message});
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
