var Mic = require('node-microphone');
var fs = require("fs");
var mic = new Mic({bitwidth:16,rate:8000,channels:1});
var micStream = mic.startRecording();
var myWritableStream = fs.WriteStream("./output.wav");
micStream.pipe( myWritableStream );
setTimeout(() => {
    mic.stopRecording();
}, 3000);
mic.on('info', (info) => {
	console.log(info);
});
mic.on('error', (error) => {
	console.log(error);
});