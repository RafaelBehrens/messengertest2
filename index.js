var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require('fs');
var CronJob = require('cron').CronJob;
var app = express();
var pg = require('pg');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

//connect to PostGres database
/*pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});

client
    .query('CREATE TABLE items(id SERIAL PRIMARY KEY, senderid BIGINT, complete BOOLEAN)')
	.on('row', function(row) {
      	console.log(JSON.stringify(row));
    });*/
    
const connectionString = process.env.DATABASE_URL;

const client = new pg.Client(connectionString);

client.connect();

/*var query = client.query('CREATE TABLE items(id SERIAL PRIMARY KEY, senderid VARCHAR(40), complete BOOLEAN)');   
query.on("end", function (result) {          
            client.end(); 
            console.log('items table created');  
        });*/


//url for classes JSON
var url = 'https://yogaia.com/api/lessons?upcoming=0&limit=10';

//get JSON, parse it and store it in classes variable
request(url, (error, response, body)=> {
  if (!error && response.statusCode === 200) {
    classes = JSON.parse(body)
    console.log("Got a response")
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
            classdatasend(event.sender.id);
            console.log(event.sender.id);
            
            var testmessage = "Hello Fede";
            sendMessage(event.sender.id, testmessage);
            const connectionString = process.env.DATABASE_URL;

			const client = new pg.Client(connectionString);

			client.connect();
			
			var query = client.query("insert into items (senderid) values "+(event.sender.id));    
        		query.on("end", function (result) {          
            	client.end(); 
            	console.log('SenderID inserted');
        	});
        	var query2 = client.query("SELECT * from items");
        		query.on("row", function (row){
        			console.log(JSON.stringify(row));
        	});
            
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
        url: 'https://graph.facebook.com/v2.6/1119887924743051/thread_settings',
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

//add get started button for first use
/*function setStartButton() {
	request({
        url: 'https://graph.facebook.com/v2.6/1119887924743051/thread_settings',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            "setting_type":"call_to_actions",
  			"thread_state":"new_thread",
  			"call_to_actions":[{
      			"payload":"USER_DEFINED_PAYLOAD"
    		}]
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};*/


//send class data
function classdatasend(recipientId) {
	
	var classelements = [];
	
	for(i=0; i<classes.length; i++){
		var classarray = {
			"title": classes[i].name + " - " + classes[i].instructor_name + " - " + classes[i].start_time,
			"subtitle": classes[i].description,
			"image_url": "https://yogaia.com/" + classes[i].instructor_img,
			"buttons":[{
				"type": "web_url",
				"url": "https://yogaia.com/view/" + classes[i].id,
				"title": "Book"
			}, {
				"type": "element_share"
			}]
		};
		classelements.push(classarray);
	}
            
            
    message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": classelements,
            }
        }
    };
    
    sendMessage(recipientId, message);

}

//var fedesenderid = 1210619582313639;

//sendMessage(fedesenderid, {text: "Hello Fede"});

/*
var job = new CronJob({
  cronTime: '* * * * * * ',
  onTick: function() {
  	classdatasend();
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
  },
  start: true
});

job.start();
*/
/*
new CronJob('* * * * * *', function(recipientId) {
  console.log('You will see this message every second');
  
}, null, true);*/
