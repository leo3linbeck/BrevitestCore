
function start_scan() {
	var result = {};
	var barcodeManager = new SharedWorker('Workers/ScanBarcode.js', 'BarcodeScanManager');
	var thePort = barcodeManager.port;
	thePort.onmessage = function(event) {
		var message = event.data;
		var url;

		switch (message.type) {
			case 'connected':
				url = 'zxing://scan/?ret=http://' + httpServer.hostName + ':' + httpServer.port + '/return_cartridgeID/' + message.uuid + escape('?val={CODE}');
				result = { success: true, uuid: message.uuid, url: url };
				exitWait();
				break;
			case 'error':
				result = { success: false, message: 'Error while monitoring test' };
				exitWait();
				break;
		}
	}
	wait();

	return result;
};

function wait_for_code(uuid) {
	// param: uuid for scan worker
	var result = {};
	var barcodeManager = new SharedWorker('Workers/ScanBarcode.js', 'BarcodeScanManager');
	var thePort = barcodeManager.port;
	thePort.onmessage = function(event) {
		var message = event.data;

		switch (message.type) {
			case 'connected':
				thePort.postMessage({ type: 'redirect', uuidFrom: uuid, uuidTo: message.uuid });
				break;
			case 'send_cartridgeID':
				result = { success: true, cartridgeID: message.cartridgeID };
				exitWait();
				break;
			case 'error':
				result = { success: false, message: 'Error while waiting for scan results' };
				exitWait();
				break;
		}
	}
	wait();
	
	return result;
};

exports.start_scan = start_scan;
exports.wait_for_code = wait_for_code;
