const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const guid = require('guid');
const MegaPi = require("megapi").MegaPi;

var mic = require('microphone');
var apiKey = "your-bing-speech-api-key";
var lastTime,header,isRecognizing = false,isRecording = false,list = [];
var vol = 0;
var outputBuffer;
mic.startCapture();
mic.audioStream.on('data', function(data) {
	if(isRecognizing){
		return;
	}
	if(data.length>44){
		list.push(data);
		if(list.length>20){
			list.shift();
		}
		var l = getRMS(data);
		if(l>0.02){
			vol += l;
		}else{
			vol *= 0.5;
		}
		var v = Math.round(vol*100)/100;
		if(v>0.3&&!isRecording){
			isRecording = true;
			setTimeout(function(){
				isRecording = false;
				isRecognizing = true;
				stopRecording();
			},1500);
		};
	}else{
		header = data;
		console.log(data.readUInt16LE(22));
		console.log(data.readUInt32LE(24));
	}
	
});

var SHORT_NORMALIZE = (1.0/32768.0)
function getRMS(buffer){
    var count = buffer.length/2;
    var sum_squares = 0.0;
    var shorts = []
    for(var i=0;i<count;i++){
    	shorts.push(buffer.readInt16LE(i*2));
    }
    for (var i=0;i<count;i++){
        var n = shorts[i] * SHORT_NORMALIZE
        sum_squares += n*n
    }
    return Math.sqrt( sum_squares / count )
}
/*
var bot = new MegaPi("/dev/ttyS0", onStart);

function onStart(){
  setTimeout(loop,500);
}
function loop(){

  setTimeout(loop,500);
}*/

function stopRecording(){
	lastTime = new Date().getTime();
	var count = list.length;
	header.writeUInt32LE(count*list[0].length,4);
	var buffer = new Buffer(count*list[0].length+44);
	for(var i=0;i<44;i++){
		buffer[i] = header[i];
	}
	for(var i=0;i<count;i++){
		var len = list[i].length;	
		for(var j=0;j<len;j++){
			index = 44+len*i+j;
			buffer[index] = list[i][j];
		}
	}
	//fs.writeFileSync("./output.wav", new Buffer(buffer));
	outputBuffer = buffer
	requestAuth(apiKey);
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
		isRecognizing = false;
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
			isRecognizing = false;
	    });
	});
	//var wavBin = fs.readFileSync("./output.wav");
	speechReq.on('error', (e) => {
	  	console.error(e);
		isRecognizing = false;
	});
	speechReq.write(outputBuffer);
	speechReq.end();
}
				