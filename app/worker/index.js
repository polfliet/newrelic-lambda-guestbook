// Worker Lambda function listens to guestbook-parser queue
exports.handler = (event, context, callback) => {
    // Process each SQS event
    event.Records.forEach(record => {
        var message = record.body;

        // Transform the message
        console.log('Worker received: ' + message);
        
        // TODO send to Elasticache
  });

  return {};
};
