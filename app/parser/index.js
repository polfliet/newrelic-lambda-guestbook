var AWS = require('aws-sdk');
var sqs = new AWS.SQS({
    region: 'eu-west-1'
});

// Parser Lambda function listens to guestbook-frontend queue
exports.handler = function(event, context, callback) {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        // Transform the message
        console.log('Parser received: ' + message);
        message = message.toUpperCase();

        // Send this message to SQS guestbook-parser
        var accountId = context.invokedFunctionArn.split(":")[4];
        var queueUrl = 'https://sqs.eu-west-1.amazonaws.com/' + accountId + '/guestbook-parser';
        var params = {
            MessageBody: message,
            QueueUrl: queueUrl
        };

        console.log('Parser pushing to queue: ' + message);
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
}
