const exec = require('child_process').exec;
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const guid = require('guid');
const SerialPort=require("serialport");
const mic = require('microphone');

var lastTime,header,isRecognizing = false,isRecording = false,list = [];
var vol = 0;
var outputBuffer;

var sp = new SerialPort("/dev/ttyS0",{baudRate:115200},function(err){
    if(!err){
    /*SerialPort.list(function(err,ports){
        console.log(ports);
    })*/
        console.log('opened!');
        sp.on('data',function(data){
            var cmds = data.toString().split("\r\n").join("").split(",");
            if(cmds[0].indexOf("setup")>-1){
                settingWifi(cmds[1],cmds[2]);
            }else if(cmds[0].indexOf("wifi")>-1){
                listWiFi(function(list){
                    sp.write(new Buffer("wifi,"+list.join(",")+"\n"));
                })
            }else if(cmds[0].indexOf("ip")>-1){
                getCurrentIp(function(ip){
                    sp.write(new Buffer("ip,"+ip+"\n"));
                });
            }
        });
    }
});
function turnOnFan(){
    if(sp&&sp.isOpen()){
        sp.write(new Buffer("fan,1\n"));
    }
}
function turnOffFan(){
    if(sp&&sp.isOpen()){
        sp.write(new Buffer("fan,0\n"));
    }
}
function debug(msg){
    if(sp&&sp.isOpen()){
        sp.write(new Buffer("debug,"+msg+"\n"));
    }else{
        console.log("debug,"+msg);
    }
}
function listWiFi(callback){
    exec('iwlist wlan0 scanning', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
	    var list = stdout.split("ESSID:\"");
	    var ssids = [];
	    for(var i=1;i<Math.min(16,list.length);i++){
		    var ssid = (list[i].split("\"\n")[0]);
		    if(ssids.indexOf(ssid)==-1){
			    ssids.push(ssid);
		    };
	    }
	    callback(ssids);
    });
}
function onConnected(callback){
    exec('iwconfig wlan0', (error, stdout, stderr) => {
        if (error) {
        }
        callback(stdout.indexOf("Access Point: Not-Associated")==-1);
    });
}
function onConnected(callback){
    exec('iwconfig wlan0', (error, stdout, stderr) => {
        if (error) {
        }
        callback(stdout.indexOf("Access Point: Not-Associated")==-1);
    });
}
function getCurrentIp(callback){
    exec('ifconfig wlan0', (error, stdout, stderr) => {
        if (error) {
        }
        if(stdout.indexOf("inet addr:")>-1){
            callback(stdout.split("inet addr:")[1].split(" ")[0]);
        }else{
            callback("no address");
        }
    });
}
function settingWifi(ssid,password){
    var buf = fs.readFileSync('/etc/wpa_supplicant/wpa_supplicant.conf');
    var str = buf.toString();
    var sindex = buf.indexOf(ssid)
    password = password.split("\n").join("");
    if(sindex>-1){
        var pindex = str.indexOf("psk=",sindex);
        pindex = str.indexOf("\"",pindex)+1;
        var eindex = str.indexOf("\"",pindex);
        str = str.split(str.substr(pindex,eindex-pindex)).join(password);
    }else{
        str += "\nnetwork={\n\t ssid=\""+ssid+"\"\n\t psk=\""+password+"\"\n\t key_mgmt=WPA-PSK\n}";
    }
    fs.writeFileSync('/etc/wpa_supplicant/wpa_supplicant.conf',new Buffer(str));
    exec('reboot', (error, stdout, stderr) => {});
}
mic.startCapture();
mic.audioStream.on('data', function(data) {
	if(isRecognizing){
		return;
	}
	if(data.length>44){
		list.push(data);
		if(list.length>40){
			list.shift();
		}
		var l = Math.round(getRMS(data)*100)/100;
		if(l>0.1){
			vol += l;
		}else{
			vol *= 0.5;
		}
		var v = Math.round(vol*100)/100;
        //debug(l+" - "+v);
        //return;
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
    debug("requesting...");
	outputBuffer = buffer
	requestAuth("1267e760dd2748aa9165ae885e7d5729");
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
    debug("recognizing...");
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
                if(result.header.name){
		                console.log("result:",result.header.name);
                        debug("result: "+result.header.name);
                        if(result.header.name.indexOf("off")>-1||result.header.name.indexOf("stop")>-1||result.header.name.indexOf("close")>-1){
                            turnOffFan();
                        }else if(result.header.name.indexOf("on")>-1||result.header.name.indexOf("start")>-1||result.header.name.indexOf("open")>-1){
                            turnOnFan();
                        }
                }else{
                        debug("result: failure!");
                }
			} catch (e) {
                        debug("result: failure!");
      		}
      		
			console.log("time:"+Math.round((new Date().getTime()-lastTime)/1000));
			isRecognizing = false;
	    });
	});
	//var wavBin = fs.readFileSync("./output.wav");
	speechReq.on('error', (e) => {
	  	console.error(e);
        debug("result: failure!");
		isRecognizing = false;
	});
	speechReq.write(outputBuffer);
	speechReq.end();
}

