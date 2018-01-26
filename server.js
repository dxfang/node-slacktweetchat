// Configuration of the Express Framework.
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
//

// Configuration of the twit package, a Twitter API Client for Node.js
var twitter_config = require('./twitter_config.js');
var twit = require('twit');
var Twitter = new twit(twitter_config);
//

// Configuration of the slack package, the Slack Developer Kit for Node.js
var slack_config = require('./slack_config.js');
var { IncomingWebhook } = require('@slack/client');
var webhook = new IncomingWebhook(slack_config.url);
//

var tweets_cashe = [];	// To store the tweets that contain the specific hashtag.

// To render the index page.
app.get('/', function(req, res) {
	res.render('index', {err_message: ''});
})

// 
app.post('/', function(req, res) {
	// Clear the cashe storage before every search 
	tweets_cashe = [];

	// Construction of the twitter search API parameters.
	var params = {
		q: req.body.hashtag,	// Setting the specific hashtag to query.
		result_type: 'recent',
		lang: 'en'
	}

	Twitter.get('search/tweets', params, function(err, data) {
		if (!err) {
			for (var i in data.statuses) {
				// Storing tweets that contain the specific hashtag to cashe storage.
				tweets_cashe.push(data.statuses[i].text);
			}
			
			for (var tweet in tweets_cashe) {
				// Using Slack Incoming Webhooks to post tweets to channel.
				webhook.send(tweets_cashe[tweet], function(err, res) {
					if (err) {
						console.log(err);
					} else {
						console.log('Message sent:', res);
					}
				});
			}
			// Redirect to index page after the form is handled.
			res.redirect('/');
		} else {
			res.render('index', {err_message: 'Invalid hashtag.'});
		}
	})
})

app.listen(process.env.PORT || 3000, function() {
	console.log('Server is listening...');
})