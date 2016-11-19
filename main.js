const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const guid = require('guid');
var Mic = require('node-microphone');
var mic = new Mic({bitwidth:16,rate:8000,channels:1});
var recordVoiceStream = fs.WriteStream("./output.wav");

var lastTime = new Date().getTime();

startRecording(3000);

mic.on('info', (info) => {
// 	console.log("info:",info);
});
mic.on('error', (error) => {
// 	console.log("error:",error);
});

function startRecording(time){
	var micStream = mic.startRecording();
	micStream.pipe(recordVoiceStream);
	setTimeout(stopRecording,time);
}

function stopRecording(){
	lastTime = new Date().getTime();
    mic.stopRecording();
    requestAuth('1267e760dd2748aa9165ae885e7d5729');
}
function requestAuth(speechKey){
	console.log("requestAuth");
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
	
	var authReq = https.request(post_options, (res) => {
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
	authReq.on('error', (e) => {
	  console.error(e);
	});
	authReq.write("");
	authReq.end();
}
function requestSpeech(authCode){
	console.log("requestSpeech");
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
				console.log("result:",result.header.name);
			} catch (e) {
      		}
      		
			console.log("time:"+Math.round((new Date().getTime()-lastTime)/1000));
	    });
	});
	var wavBin = fs.readFileSync("./output.wav");
	speechReq.on('error', (e) => {
	  console.error(e);
	});
	speechReq.write(wavBin);
	speechReq.end();
}
				