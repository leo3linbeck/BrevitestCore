var dispatchData = require('dispatch-data');

var dispatch = dispatchData.params;
var path = dispatchData.workerPath;

var workers = {}; // one worker per online device
var ports = {}; // one port per online device

function sendToClient(deviceID, obj) {
	console.log('Sending message to client');
	try {
		ports[deviceID].postMessage(JSON.stringify(obj));
		console.log('Message sent', obj);
	}
	catch(e) {
		console.log('Unable to send message', e);
	}
}

onconnect = function(event) {
	var thePort = event.ports[0];
	thePort.binaryType = 'string';
	thePort.onclose = function() {
		
	};
	thePort.onmessage = function(message) {
		var data = JSON.parse(message.data); // data must include deviceID and type, and func if first time
		var type = data.type;
		var deviceID = data.deviceID;
		
		if (!workers[deviceID] && data.func) {
			console.log('Starting worker');
			workers[deviceID] = startWorker(path + dispatch[data.func].module + '.js');
		}
		ports[deviceID] = thePort;
		
		console.log('Processing message, type=' + type, data);
		switch (type) {
			case 'run':
				workers[deviceID].postMessage({ command:'start', data: data });
				break;
			case 'cancel':
				workers[deviceID].postMessage({ command:'cancel', data: data, shouldTerminate: true });
				break;
			case 'reconnect':
				console.log('Client websocket reconnected');
				break;
		}
	};
	
	thePort.postMessage(JSON.stringify({ type: 'connected' }) );
	
	wait();
}

function startWorker(moduleName) {
	worker = new Worker(moduleName);
	worker.onmessage = function(event) {
		var data = event.data;
		
		var type = data.type ? data.type : '';
		var shouldTerminate = data.shouldTerminate ? true : false;
		var message = data.message ? data.message : '';
		var userData = data.data ? data.data : {};
		var dataName = data.name ? data.name : '';
		var command = data.command ? data.command : '';	
		var deviceID = data.deviceID ? data.deviceID : '';
		var dataSources = data.dataSources ? data.dataSources : [];
		var func = data.func ? data.func : '';
		var param = data.param ? data.param : {};

		console.log('worker onmessage', data);
		
		switch (type) {
			case 'cancelling':
				sendToClient(deviceID, { type: 'cancelling', message:'Cancelling process', deviceID: deviceID, dataSources: dataSources });
				break;
			case 'done':
				sendToClient(deviceID, { type: 'done', message: dispatch[func].doneMessage, deviceID: deviceID });
				break;
			case 'error':
				sendToClient(deviceID, { type: 'error', message: message, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_message':
				sendToClient(deviceID, { type: 'message', message: message, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_data':
				sendToClient(deviceID, { type: 'data', name: dataName, data: userData, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'user_command':
				sendToClient(deviceID, { type: 'command', command: command, deviceID: deviceID, dataSources: dataSources });
				break;
			case 'percent_complete':
				sendToClient(deviceID, { type: 'percent_complete', data: userData });
				break;
			case 'reload_cartridges':
				sendToClient(deviceID, { type: 'reload_cartridges' });
				break;
		}
	};
	return worker;
}
