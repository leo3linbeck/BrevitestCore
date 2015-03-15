function sendCartridgeID(cartridgeID, uuid) {
	var updateManager = new SharedWorker('Workers/ScanBarcode.js', 'BarcodeScanManager');
	var thePort = updateManager.port;
	thePort.onmessage = function(event) {
		var message = event.data;
		if (message.type === 'connected') {
			thePort.postMessage({ type: 'cartridgeID_received', cartridgeID: cartridgeID, uuid: uuid });
			thePort.postMessage({ type: 'disconnect', uuid: message.uuid });
			exitWait();
		}
	}
	wait();
}

function cartridgeIDresponse(request, response) {
	var cartridge, cartridgeID, pos, str, uuid;
	
	str = request.url.split('/')[2];
	if (str.length === 69) {
		uuid = str.substr(0, 32);
		cartridgeID = str.substr(37, 32);
		cartridge = ds.Cartridge(cartridgeID);
		if (cartridge) {
			sendCartridgeID(cartridgeID, uuid);
			response.statusCode = 200;
			response.contentType = 'text/html';
			response.body = '<html><head></head><body onLoad="window.close()"></body></html>';
		}
		else {
			response.statusCode = 400;
			response.message = 'Cartridge ID ' + cartridgeID + 'not found.';
		}
	}
	else {
		response.statusCode = 400;
		response.message = ('Return results not valid: ' + str);
	}

//	return response;	
}
