var spark = require('sparkCore');
var daemonStarted = false;

function updateDeviceData() {
	console.log('Retrieving spark core list');
	var result = spark.get_core_list();
	if (result.success) {
		var device = ds.Device.query('sparkCoreID !== null');
		device.forEach(function(d) {
			d.update_status(result.response);
		});
		postMessage({ type: 'push_update' });
	}
}

onmessage = function(msg) {
	var data = msg.data;
	var startTime;
	console.log('Device daemon message');
	
	try {
		switch (message.type) {
			case 'start':
				if (!daemonStarted) {
					daemonStarted = true;
					startTime = new Date();
					updateDeviceData();
					(function check() {
						var now = new Date();
						setTimeout(function() {
							updateDeviceData();
							if ((now - startTime) < message.timeout) {
								check();
							}
							else {
								console.log('Device daemon disconnected');
								close();
							}
						}, message.interval);  //re-run every minute
					})();
				}
				break;
			case 'run':
				updateDeviceData();
				break;
			case 'stop':
				close();
				break;
		}
	}
	catch(e) {
		postMessage({ type: 'error', data: e });
	}
}
