var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require('fs');
var schedule = require('node-schedule');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

/*//load unparsed JSON w class info 
var classesUnparsed = fs.readFileSync('classes.json', 'utf8');

//parse JSON appropriately
var classes = JSON.parse(classesUnparsed);

//load JSON from URL
var classes;*/

//url for classes JSON
var url = 'https://yogaia.com/api/lessons?upcoming=0&limit=10';

//get JSON, parse it and store it in classes variable
request(url, (error, response, body)=> {
  if (!error && response.statusCode === 200) {
    classes = JSON.parse(body)
    console.log("Got a response: ", classes)
  } else {
    console.log("Got an error: ", error, ", status code: ", response.statusCode)
  }
})

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

function setGreeting() {
	request({
        url: 'https://graph.facebook.com/v2.6/<PAGE_ID>/thread_settings',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            "setting_type": "greeting",
            "greeting":{
            	"text": "Hi {{user_first_name}}, I'm a prototype bot by Yoga.ai. I'm currently a bit unsophisticated, but I'll try and let you know the day's upcoming live classes."
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

setGreeting();


//send class data
function classdatasend(recipientId, text) {
            
            
    message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                        "title": classes[0].name,
                        "subtitle": classes[0].description,
                        "image_url": "https://yogaia.com/" + classes[0].instructor_img ,
                        "buttons": [{
                            "type": "web_url",
                            "url": "https://yogaia.com/view/" + classes[0].id,
                            "title": "Book"
                            }, {
                            "type": "postback",
                            "title": "Share",
                            "payload": "User " + recipientId + " clicked button",
                        }]
                    }, {
                        "title": classes[1].name,
                        "subtitle": classes[1].description,
                        "image_url": "https://yogaia.com/" + classes[1].instructor_img ,
                        "buttons": [{
                            "type": "web_url",
                            "url": "https://yogaia.com/view/" + classes[1].id,
                            "title": "Book"
                            }, {
                            "type": "postback",
                            "title": "Share",
                            "payload": "User " + recipientId + " clicked button",
                        }]
                    }, {
                        "title": classes[2].name,
                        "subtitle": classes[2].description,
                        "image_url": "https://yogaia.com/" + classes[2].instructor_img ,
                        "buttons": [{
                            "type": "web_url",
                            "url": "https://yogaia.com/view/" + classes[2].id,
                            "title": "Book"
                            }, {
                            "type": "postback",
                            "title": "Share",
                            "payload": "User " + recipientId + " clicked button",
                        }],
                    }]
                }
            }
        };
    
    sendMessage(recipientId, message);
            
    return true;
}

