var AWS = require('aws-sdk');
var db = new AWS.DynamoDB({
    region: 'eu-west-1'
});

// Worker Lambda function listens to guestbook-parser queue
exports.handler = (event, context, callback) => {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        // Transform the message
        console.log('Worker received: ' + message);
        
        // Store message in DynamoDB
        var params = {
            TableName: 'GUESTBOOK_MESSAGES',
            Item: {
                'MESSAGE' : {S: message}
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
};
