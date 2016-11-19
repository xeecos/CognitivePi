const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const guid = require('guid');
var mic = require('mic');
var wav = require('node-wav');

var wavBin;// = fs.readFileSync('./assets/test.wav');

var micInstance = mic({ 'rate': '8000', 'channels': '1', 'debug': true, 'exitOnSilence': 6 });
var micInputStream = micInstance.getAudioStream();

var outputWavStream = fs.WriteStream('output.wav');
micInputStream.pipe(outputWavStream);
 
micInputStream.on('data', function(data) {
    console.log("Recieved Input Stream: " + data.length);
});
 
micInputStream.on('error', function(err) {
    cosole.log("Error in Input Stream: " + err);
});
 
micInputStream.on('startComplete', function() {
        console.log("Got SIGNAL startComplete");
        setTimeout(function() {
                micInstance.pause();
            }, 5000);
    });
    
micInputStream.on('stopComplete', function() {
        console.log("Got SIGNAL stopComplete");
	wavBin = wav.encode(outputWavStream, { sampleRate: 8000, float: true, bitDepth: 32 });
    });
    
micInputStream.on('pauseComplete', function() {
        console.log("Got SIGNAL pauseComplete");
        setTimeout(function() {
                micInstance.resume();
            }, 5000);
    });
 
micInputStream.on('resumeComplete', function() {
        console.log("Got SIGNAL resumeComplete");
        setTimeout(function() {
                micInstance.stop();
            }, 5000);
    });
 
micInputStream.on('silence', function() {
        console.log("Got SIGNAL silence");
    });
 
micInputStream.on('processExitComplete', function() {
        console.log("Got SIGNAL processExitComplete");
    });
 
micInstance.start();
//requestAuth('1267e760dd2748aa9165ae885e7d5729');

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
	speechReq.write(wavBin);
	speechReq.end();
}
				