

model.User.methods.start_daemons = function() {
	var updateManager = new SharedWorker('Workers/SparkCoreUpdate.js', 'UpdateManager');
	var thePort = updateManager.port;
	thePort.onmessage = function(event) {
		var message = event.data;
		switch (message.type) {
			case 'connected': 
				console.log('UpdateManager connected');
				thePort.postMessage({ type: 'disconnect', ref: message.ref });
				result = { success: true, message: 'UpdateManager connected' };
				exitWait();
				break;
			case 'error':
				result = { success: false, message: 'Error while cancelling test' };
				exitWait();
				break;
		}
	}
	wait();
	
	return result;
};

model.User.methods.start_daemons.scope = 'public';

