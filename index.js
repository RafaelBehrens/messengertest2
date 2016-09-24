var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require('fs');
var schedule = require('node-schedule');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

//load unparsed JSON w class info 
var classesUnparsed = fs.readFileSync('classes.json', 'utf8');

//parse JSON appropriately
var classes = JSON.parse(classesUnparsed);

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is a Messenger Bot Server, you can not access this here! :(');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        
        if (event.message && event.message.text) {
            if (!classdatasend(event.sender.id, event.message.text)) {
                sendMessage(event.sender.id, {text: "Echo: " + classes[0].intensity});
            }
        } else if (event.postback) {
            console.log("Postback received: " + JSON.stringify(event.postback));
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};
// send class data
function classdatasend(recipientId, text) {
            
    var imageUrl = "https://yogaia.com/view/" + classes[0].id;
            
    message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                	for (i = 0; i < classes.length; i++) {
                    	"title": classes[i].name,
                    	"subtitle": classes[i].description,
                    	"image_url": "https://yogaia.com/" + classes[i].instructor_img ,
                    	"buttons": [{
                        "type": "web_url",
                        "url": imageUrl,
                        "title": "Book"
                        }, {
                        "type": "postback",
                        "title": "Share",
                        "payload": "User " + recipientId + " likes kitten " + imageUrl,
                    	}]
                    }
                }]
            }
        }
    };
    
    sendMessage(recipientId, message);
            
    return true;
}
