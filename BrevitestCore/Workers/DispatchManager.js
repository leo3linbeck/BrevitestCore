var dispatchData = require('dispatch-data');
var eventsource = require('wakanda-eventsource');
eventsource.start('/status');

var dispatch = dispatchData.params;
var path = dispatchData.workerPath;
var worker;
var workerRunning = false;
var uuid;

onconnect = function(msg) {
	var thePort = msg.ports[0];
	thePort.onmessage = function(event) {
		var message = event.data.message;
		var id = event.data.id;
		var func = event.data.func;
		var param = event.data.param;
		var interval = event.data.interval ? event.data.interval : 60000;
		var timeout = event.data.timeout ? event.data.timeout : 3600000;
		switch (message) {
			case 'start':
				if (!workerRunning) {
					workerRunning = true;
					startTime = new Date();
					runWorker(func, param);
					(function doIt() {
						var now = new Date();
						setTimeout(function() {
							runWorker(func, param);
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
				thePort.postMessage({ message:'started', id: id });
				break;
			case 'stop':
				if (workerRunning) {
					workerRunning = false;
				}
				thePort.postMessage({ message:'stopped', id: id });
				break;
			case 'runOnce':
				thePort.postMessage({ message:'running', id: id });
				runWorker(func, param);
				break;
			case 'cancel':
				if (workerRunning) {
					worker.postMessage({ 'shouldTerminate': true });
				}
				thePort.postMessage({ message:'cancelled', id: id });
				break;
			case 'multistep_begin':
				thePort.postMessage({ message:'beginning', id: id });
				runWorker(func, param);
				break;
			case 'multistep_end':
				thePort.postMessage({ message:'ending', id: id });
				runWorker(func, param);
				break;
		}
	}
	thePort.postMessage({ type: 'initialized' });
}

function runWorker(func, param) {
	if (!workerRunning) {
		workerRunning = true;
		worker = new Worker(path + dispatch[func].module + '.js');
		worker.postMessage({ message:'start', func: func, param : param });
		worker.onmessage = function(e) {
			var data = e.data;

			console.log(data);
			if (data.type === 'done') {
				eventsource.push({ type: 'process_stopped'}, true);
				exitWait();
			}
			else {
				if (data.type === 'error') {
					eventsource.push(data.data, true);
					eventsource.push({ type: 'process_stopped'}, true);
					exitWait();
				}
				else {
					eventsource.push(data, true);
				}
			}
		}
		wait();
		
		workerRunning = false;
	}
}
