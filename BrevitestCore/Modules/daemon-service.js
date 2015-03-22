/*	Handler function for service messages (required)
*/
exports.postMessage = function (message) {

	if (message.name === 'applicationWillStart') {
		/* 	This is the first message sent to the service.
			It's a good location to initialize and start the service */
		console.log('Initializing daemons');
		startDeviceDaemon(300000, 3600000);
		startTestDaemon(300000, 3600000);
	}
	else if (message.name === 'applicationWillStop') {
		/*	The service should be stopped and ended here */
//		deviceDaemon.port.postMessage({ message: 'stop' });
//		testDaemon.port.postMessage({ message: 'stop' });
//		deviceDaemon = null;
//		testDaemon = null;
	}
	else if (message.name === 'httpServerDidStart') {
		/*	This message should be handled if the service depends on the HTTP Server status */
	}
	else if (message.name === 'httpServerWillStop') {
		/*	This message should be handled if the service depends on the HTTP Server status */
	}
	else if (message.name === 'catalogWillReload') {
		/*	This message should be handled if the service depends on the Model and uses the 'ds' property */
	}
	else if (message.name === 'catalogDidReload') {
		/*	This message should be handled if the service depends on the Model and uses the 'ds' property */
	}	
};


/*	The application storage can be used to store private data.
	The service data is accessed as follows: var serviceDatas = storage.getItem('services').daemon-service;
	
	In the same way, the application setting's storage contains the service settings, which are usually defined in the project's settings file.
	The service settings are accessed as follows: var serviceSettings = settings.getItem('services').daemon-service;
	
	For more information, refer to http://doc.wakanda.org/Wakanda Studio0.2/help/Title/en/page3326.html
*/
var deviceDaemon = null;
var testDaemon = null;

function startDeviceDaemon(interval, timeout) {
	console.log('Creating device daemon');
	deviceDaemon = new SharedWorker('Workers/DeviceDaemon.js');
	deviceDaemon.port.onmessage = function(event) {
		console.log('Message received from device daemon');
		var message = event.data;
		switch (message.type) {
			case 'connected':
				deviceDaemon.port.postMessage({ type: 'start', interval: interval, timeout: timeout });
				console.log('Device daemon connected');
				exitWait();
				break;
		}
	}
	wait();
}

function startTestDaemon(interval, timeout) {
	console.log('Creating test daemon');
	testDaemon = new SharedWorker('Workers/TestDaemon.js');
	testDaemon.port.onmessage = function(event) {
		console.log('Message received from test daemon');
		var message = event.data;
		switch (message.type) {
			case 'connected':
				testDaemon.port.postMessage({ type: 'start', interval: interval, timeout: timeout });
				console.log('Test daemon connected');
				exitWait();
				break;
		}
	}
	wait();
}
