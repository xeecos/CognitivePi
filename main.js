const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const guid = require('guid');
 
var wav = fs.readFileSync('./assets/test.wav');
requestAuth('1267e760dd2748aa9165ae885e7d5729');

function requestAuth(speechKey){
	var post_options = {
		method: 'POST',
		host: 'api.cognitive.microsoft.com',
		path: '/sts/v1.0/issueToken',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': '0',
			'Ocp-Apim-Subscription-Key': speechKey
		}
	};
	
	var post_req = https.request(post_options, (res) => {
	    var chunks = '';
	    res.setEncoding('utf8');
	    res.on('data', (chunk) => {
	      chunks += chunk;
	    });
	    res.on('end', () => {
	        var error, result;
		requestSpeech(chunks);
	    });
	});
	post_req.write("");
	post_req.end();
}
function requestSpeech(authCode){
	var post_params = {
	    'version': '3.0',
	    'requestid': guid.raw(), // changes each call
	    'instanceid': '1d4b6030-9099-11e0-91e4-0800200c9a66', // changes at each instance
	    'appID': 'f84e364c-ec34-4773-a783-73707bd9a585', // never changes
	    'format': 'json',
	    'locale': 'en-US',
	    'device.os': 'Linux',
	    'scenarios': 'ulm'
  	};
	var speechOptions = {
		method: 'POST',
		host: 'speech.platform.bing.com',
		path: '/recognize/query?'+querystring.stringify(post_params),
		headers: {
			'Content-Type': 'audio/wav; samplerate=8000',
			'Authorization': "Bearer "+authCode
		}
	}
	var speechReq = https.request(speechOptions, (res) => {
	    var chunks = '';
	    res.setEncoding('utf8');
	    res.on('data', (chunk) => {
	      chunks += chunk;
	    });
	    res.on('end', () => {
	        var error, result;
		try {
			result = JSON.parse(chunks);
			console.log(result.header.name);
		} catch (e) {
      		}
	    });
	});
	speechReq.write(wav);
	speechReq.end();
}
				