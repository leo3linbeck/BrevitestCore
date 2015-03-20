function updateTestData() {
	console.log('Updating test data');
	
	var cartridges = ds.Cartridge.query('test.percentComplete === 100 AND finishedOn === null');
	cartridges.forEach(function(c) {
		c.get_data_from_device();
	});
	
	var cartridges = ds.Cartridge.query('test.percentComplete < 100 AND test.percentComplete !== null AND startedOn < :1', new Date(new Date() - 1200000));
	cartridges.forEach(function(c) {
		c.mark_as_failed();
	});
}

function onconnect(msg) {
	var fromPort = msg.ports[0];
	console.log('Test daemon connected');
	fromPort.onmessage = function (event) {
		var message = event.data;
		var startTime;
		
		switch (message.type) {
			case 'start':
				if (!daemonStarted) {
					daemonStarted = true;
					startTime = new Date();
					updateTestData();
					(function check() {
						var now = new Date();
						setTimeout(function() {
							updateTestData();
							if ((now - startTime) < message.timeout) {
								check();
							}
							else {
								console.log('Test daemon disconnected');
								close();
							}
						}, message.interval);  //re-run every minute
					})();
				}
				break;
			case 'stop':
				close();
		}
	}
	fromPort.postMessage({ type: 'connected' });
}

var daemonStarted = false;