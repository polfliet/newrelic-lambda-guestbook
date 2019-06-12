const newrelic = require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const querystring = require('querystring');
console.log('AWS_REGION: ' + process.env.AWS_REGION);
var workshopPrefix = process.env.WORKSHOP_PREFIX;
if (workshopPrefix === undefined) {
    workshopPrefix = '';
}
console.log('WORKSHOP_PREFIX: ' + workshopPrefix);

var AWS = require('aws-sdk');
AWS.config.update({region: process.env.AWS_REGION});
var db = new AWS.DynamoDB();
var sqs = new AWS.SQS();

// Get SQS queue
var queueUrl;
var params = {
    QueueName: workshopPrefix + 'guestbook-frontend'
};
sqs.getQueueUrl(params, function(err, data) {
    if (err) {
        console.log('Error fetching queue url', err);
    } else {
        queueUrl = data.QueueUrl;
    }
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.locals.newrelic = newrelic;

// Render home page
app.get('/', function (req, res) {
    res.render('index', { title: 'New Relic K8s Guestbook', message: 'Post a message on our Lambda guestbook.' });
});

// Get messages from DynamoDB
app.get('/message', function (req, res) {
    console.error(' [x] Get messages from DynamoDB')
    var params = {
        TableName: workshopPrefix + 'GUESTBOOK_MESSAGES',
        ExpressionAttributeValues: {
            ':c': {S: '1'}
        },
        KeyConditionExpression: 'CHANNEL = :c',
        ScanIndexForward: false
    };

    // Call DynamoDB to read the last guestbook message
    db.query(params, function(err, data) {
        if (err) {
            console.log('DynamoDB error', err);
        } else {
            console.log('DynamoDB data', data.Items);
            if (data.Items.length > 0) {
                return res.send(data.Items[0].MESSAGE.S)
            } else {
                return res.send('');
            }

        }
    });
});

// Post a message to the guestbook
app.post('/message', function(req, res) {
    var transaction = newrelic.getTransaction();
    var payload = transaction.createDistributedTracePayload();
    var message = req.body.message;

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

    console.log('Frontend pushing to queue: ' + message);

    sqs.sendMessage(params, function(err, data) {
        if (err) {
            console.log('Frontend error sending to queue: ', err);
        }
        res.status(200).send('OK');
    });   
});

// Health check
app.get('/healthz', function (req, res) {
    res.status(200).send('OK');        
});

app.listen(process.env.PORT || 3000, function () {
    console.error('Frontend ' + process.env.NEW_RELIC_METADATA_KUBERNETES_POD_NAME + ' listening on port 3000!');
});
