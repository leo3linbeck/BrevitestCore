/*	Handler function for service messages (required)
*/

var dispatchManager, dispatchPort;
var dispatchAvailable = false;

function initializeDispatchManager() {
	if (!dispatchAvailable) {
		dispatchManager = new SharedWorker('Workers/DispatchManager.js', 'DispatchManager');
		dispatchPort = dispatchManager.port;
		dispatchPort.onmessage = function(event) {
			var message = event.data;
			switch (message.type) {
				case 'initialized':
					dispatchAvailable = true;
					console.log('Dispatch manager initialized');
					exitWait();
					break;
				case 'stopped': 
					console.log('Dispatch manager stopped');
					dispatchAvailable = false;
					exitWait();
					break;
				case 'error':
					console.log('Error in dispatch manager');
					dispatchAvailable = false;
					exitWait();
					break;
			}
		}
		wait();
	}
}

exports.postMessage = function (message) {
	switch (message.name) {
		case 'applicationWillStart':
		/* 	This is the first message sent to the service.
			It's a good location to initialize and start the service */
			console.log('Initializing dispatch manager');
			initializeDispatchManager();
			break;
		case 'applicationWillStop':
		/*	The service should be stopped and ended here */
			if (dispatchPort) {
				dispatchPort.postMessage('stop');
			}
			break;
		case 'httpServerDidStart':
		/*	This message should be handled if the service depends on the HTTP Server status */
			break;
		case'httpServerWillStop':
		/*	This message should be handled if the service depends on the HTTP Server status */
			break;
		case 'catalogWillReload':
		/*	This message should be handled if the service depends on the Model and uses the 'ds' property */
			break;
		case 'catalogDidReload':
		/*	This message should be handled if the service depends on the Model and uses the 'ds' property */
			break;
	}
};

/*	The application storage can be used to store private data.
	The service data is accessed as follows: var serviceDatas = storage.getItem('services').dispatch;

	In the same way, the application setting's storage contains the service settings, which are usually defined in the project's settings file.
	The service settings are accessed as follows: var serviceSettings = settings.getItem('services').dispatch;

	For more information, refer to http://doc.wakanda.org/Wakanda Studio0.2/help/Title/en/page3326.html
*/

function talkToWorker(inMessage) {
	var timeout = 5000;
	var worker = new SharedWorker('Workers/DispatchManager.js', 'DispatchManager');
	var workerPort = worker.port;
	var messageId = generateUUID();
	var outMessage;

	workerPort.postMessage({
		'message': inMessage.message, 
		'id': messageId, 
		func: inMessage.func,
		param: inMessage.param, 
		uuid: inMessage.uuid
	});

	workerPort.onmessage = function(e) {
		outMessage = e.data;
		if (outMessage.id === messageId) {
			exitWait();
		}
	}

	wait(timeout);

	if (typeof outMessage === 'undefined') {
		outMessage = {'message' : 'timeout', 'id' : messageId};
	}

	delete outMessage.id;
	return outMessage;
}

function cancel(func, param) {
	return talkToWorker({ message:'cancel', func: func, param: param });
}

function start(func, param) {
	return talkToWorker({ message:'start', func: func, param: param });
}

function stop(func, param) {
	return talkToWorker({ message:'stop', func: func, param: param });
}

function runOnce(func, param) {
	return talkToWorker({ message:'runOnce', func: func, param: param });
}

function multistep_begin(func, param) {
	return talkToWorker({ message:'multistep_begin', func: func, param: param });
}

function multistep_step(func, param, uuid) {
	return talkToWorker({ message:'multistep_step', func: func, param: param, uuid: uuid });
}

function multistep_end(func, param, uuid) {
	return talkToWorker({ message:'multistep_end', func: func, param: param, uuid: uuid });
}

exports.runOnce = runOnce;
exports.start = start;
exports.stop = stop;
exports.cancel = cancel;
exports.multistep_begin = multistep_begin;
exports.multistep_step = multistep_step;
exports.multistep_end = multistep_end;
