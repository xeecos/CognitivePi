const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1024, height: 760})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/html/index.html`)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  var sp = require("serialport")
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  initBluetooth();
}
function initBluetooth(){
	var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
 
	btSerial.on('found', function(address, name) {
		console.log(address,name);
		return;
		btSerial.findSerialPortChannel(address, function(channel) {
			btSerial.connect(address, channel, function() {
				console.log('connected');
	 
				btSerial.write(new Buffer('my data', 'utf-8'), function(err, bytesWritten) {
					if (err) console.log(err);
				});
	 
				btSerial.on('data', function(buffer) {
					console.log(buffer.toString('utf-8'));
				});
			}, function () {
				console.log('cannot connect');
			});
	 
			// close the connection when you're ready 
			btSerial.close();
		}, function() {
			console.log('found nothing');
		});
	});
	 
	btSerial.inquire();
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.