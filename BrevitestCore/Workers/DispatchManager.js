var dispatchData = require('dispatch-data');

var dispatch = dispatchData.params;
var path = dispatchData.workerPath;
var worker;
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
		var func, interval, param, timeout;
		
		var data = JSON.parse(message.data);
		var type = data.type;
		var id = data.id;
		
		switch (type) {
			case 'start':
				interval = data.interval ? data.interval : 60000;
				timeout = data.timeout ? data.timeout : 3600000;
				func = data.func;
				param = data.param;
				if (!workerRunning) {
					workerRunning = true;
					startTime = new Date();
					runWorker(func, param, thePort, id);
					(function doIt() {
						var now = new Date();
						setTimeout(function() {
							runWorker(func, param, thePort, id);
							if (workerRunning) {
								if ((now - startTime) < timeout) {
									doIt();
								}
								else {
									console.log(func + ' timeout');
								}
							}
							else {
								console.log(func + ' stopped');
							}
						}, interval);  //re-run every minute
					})();
				}
				break;
			case 'stop':
				if (workerRunning) {
					workerRunning = false;
				}
				break;
			case 'runOnce':
				func = data.func;
				param = data.param;
				runWorker(func, param, thePort, id);
				break;
			case 'cancel':
				if (workerRunning) {
					worker.postMessage({ 'shouldTerminate': true });
				}
				sendObjectToClient(thePort, { type: 'message', message:'cancelled', id: id });
				break;
			case 'multistep_begin':
				sendObjectToClient(thePort, { type: 'message', message:'beginning', id: id });
				runWorker(func, param, thePort, id);
				break;
			case 'multistep_end':
				sendObjectToClient(thePort, { type: 'message', message:'ending', id: id });
				runWorker(func, param, thePort, id);
				break;
		}
	};
	sendObjectToClient(thePort, { type: 'connected' });
}

function runWorker(func, param, port, id) {
	if (!workerRunning) {
		workerRunning = true;
		worker = new Worker(path + dispatch[func].module + '.js');
		worker.postMessage({ message:'start', func: func, param : param });
		worker.onmessage = function(event) {
			var data = event.data;

			console.log(data);
			switch (data.type) {
				case 'done':
					sendObjectToClient(port, { type: 'result', result: data.data, id: id });
					exitWait();
					break;
				case 'error':
					sendObjectToClient(port, { type: 'error', message: data.message, id: id });
					exitWait();
					break;
				case 'user_message':
					sendObjectToClient(port, { type: 'message', message: data.message, id: id });
					break;
				case 'user_data':
					sendObjectToClient(port, { type: 'data', data: data.data, id: id });
					break;
				case 'user_command':
					sendObjectToClient(port, { type: 'command', command: data.command, id: id });
					break;
			}
		}
		wait();
		
		workerRunning = false;
	}
}
