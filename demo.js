var mic = require('microphone');
const fs = require("fs");

var list = []; 
var header;
mic.startCapture();

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

// : spawn('arecord', ['-D', 'plughw:1,0', '-f', 'S16_LE','-r','8000']);