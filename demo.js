var mic = require('microphone');
const fs = require("fs");
const WavEncoder = require("wav-encoder");

var SHORT_NORMALIZE = 1.0/32768.0;

mic.startCapture();
var list = [];
setTimeout(function(){
    mic.stopCapture();

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