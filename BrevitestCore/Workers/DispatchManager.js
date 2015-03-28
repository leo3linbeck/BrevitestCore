var dispatchData = require('dispatch-data');

var dispatch = dispatchData.params;
var path = dispatchData.workerPath;

var workers = {}; // one worker per online device
var workerRunning = false;

function sendObjectToClient(port, obj) {
	port.postMessage(JSON.stringify(obj));
}

onconnect = function(event) {
	var thePort = event.ports[0];
	thePort.binaryType = 'string';
	thePort.onclose = function() {
		
	};
	thePort.onmessage = function(message) {
		var data, dataSources, device, deviceID, func, interval, packet, param, timeout, type;
		
		packet = JSON.parse(message.data);
		type = packet.type;
		deviceID = packet.deviceID;
		dataSources = packet.dataSources;
		func = packet.func;
		param = packet.param;
		
		if (!workers[deviceID]) {
			console.log('Starting worker');
			startWorker(func, param, thePort, deviceID, dataSources);
		}
		
		switch (type) {
			case 'run':
				workers[deviceID].postMessage({ message:'start', func: func, param : param, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'cancel':
				workers[deviceID].postMessage({ message:'cancel', deviceID: deviceID, dataSources: dataSources, shouldTerminate: true });
				break;
//			case 'repeatStart':
//				interval = data.interval ? data.interval : 60000;
//				timeout = data.timeout ? data.timeout : 3600000;
//				func = data.func;
//				console.log('repeatStart', deviceID, func, interval, timeout);
//				param = data.param;
//				if (!workerRunning) {
//					workerRunning = true;
//					startTime = new Date();
//					runWorker(func, param, thePort, deviceID, dataSources);
//					(function doIt() {
//						var now = new Date();
//						setTimeout(function() {
//							runWorker(func, param, thePort, deviceID, dataSources);
//							if (workerRunning) {
//								if ((now - startTime) < timeout) {
//									doIt();
//								}
//								else {
//									console.log(func + ' timeout');
//								}
//							}
//							else {
//								console.log(func + ' stopped');
//							}
//						}, interval);
//					})();
//				}
//				break;
//			case 'repeatStop':
//				if (workerRunning) {
//					workerRunning = false;
//				}
//				console.log('repeatStop', deviceID);
		}
	};
	sendObjectToClient(thePort, { type: 'connected' });
}

function startWorker(func, param, port, deviceID, dataSources) {
	workers[deviceID] = new Worker(path + dispatch[func].module + '.js');
	workers[deviceID].onmessage = function(event) {
		var data = event.data;

		console.log('worker onmessage', data);
		switch (data.type) {
			case 'cancel':
				shouldTerminate = true;
				sendObjectToClient(port, { type: 'message', message:'cancelled', deviceID: deviceID, dataSources: dataSources });
				break;
			case 'done':
				sendObjectToClient(port, { type: 'result', result: data.data, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'error':
				sendObjectToClient(port, { type: 'error', message: data.message, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_message':
				sendObjectToClient(port, { type: 'message', message: data.message, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_data':
				sendObjectToClient(port, { type: 'data', data: data.data, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_command':
				sendObjectToClient(port, { type: 'command', command: data.command, deviceID: deviceID, dataSources: dataSources });
				break;
		}
	};
}
