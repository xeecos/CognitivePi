var mic = require('microphone');
const fs = require("fs");
<<<<<<< HEAD
const WavEncoder = require("wav-encoder");

var SHORT_NORMALIZE = 1.0/32768.0;
=======
>>>>>>> 3a36c9a8afc459f4c2f938b942b4bd4c8f98cc1b

var list = []; 
var header;
mic.startCapture();
var list = [];
setTimeout(function(){
    mic.stopCapture();

<<<<<<< HEAD
    var count = list.length;
	var data = new ArrayBuffer(count*list[0].length);
	var bytes = new Uint8Array(data);
    for(var i=0;i<count;i++){
        var len = list[i].length
        for(var j=0;j<len;j++){
            bytes[i*len+j] = list[i][j];
        }
    }
    var floats = new Float32Array(data);
    
    const recordWav = {
        sampleRate: 8000,
        channelData: [
            floats,
            floats
        ]
    };
    WavEncoder.encode(recordWav).then((buffer) => {
        fs.writeFileSync("noise.wav", new Buffer(buffer));
    });
},5000);
mic.audioStream.on('data', function(data) {
    list.push(data);
    // var l = getRMS(data);
    // if(l>1.32){
    // console.log(l); 
    // }
=======
setTimeout(function(){
	mic.stopCapture();
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
	fs.writeFileSync("output.wav", new Buffer(buffer));
},4000);
mic.audioStream.on('data', function(data) {
	if(data.length>44)
		list.push(data);
	else{
		header = data;
		console.log(data.readUInt16LE(22));
		console.log(data.readUInt32LE(24));
	}
    /*var l = getRMS(data);
    if(l>0.02){
    	console.log(l); 
    }*/
>>>>>>> 3a36c9a8afc459f4c2f938b942b4bd4c8f98cc1b
});

function getRMS(buffer){
    var count = buffer.length;
	var data = new ArrayBuffer(count);
	var bytes = new Uint8Array(data);
	for(var i=0;i<count;i++){
		bytes[i] = buffer[i];
	}
	var shorts = new Int16Array(data);
    var sum_squares = 0.0;
    var s = "";
    for(var i=0;i<shorts.length;i++){
    	var b = shorts[i];
    	var n = b * SHORT_NORMALIZE
        sum_squares += n*n
    }
    return Math.sqrt(sum_squares/count);
}

// : spawn('arecord', ['-D', 'plughw:1,0', '-f', 'S16_LE','-r','8000']);