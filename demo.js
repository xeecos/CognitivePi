var mic = require('microphone');

mic.startCapture();

mic.audioStream.on('data', function(data) {
	var l = getRMS(data);
	if(l>1.36){
    	console.log(l); 
    }
});

var SHORT_NORMALIZE = (1.0/32768.0)
function getRMS(buffer){
	var count = buffer.length/2;
    var sum_squares = 0.0;
    var shorts = []
    for(var i=0;i<count;i++){
    	shorts.push(buffer.readUInt16LE(i*2));
	}
    for (var i=0;i<count;i++){
        var n = shorts[i] * SHORT_NORMALIZE
        sum_squares += n*n
	}
    return Math.sqrt( sum_squares / count )
}