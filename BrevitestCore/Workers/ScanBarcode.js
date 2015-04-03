var connections = {};

onconnect = function onconnect(event) {
	var thePort = event.ports[0];
	var uuidKey = generateUUID();
	connections[uuidKey] = thePort;

	thePort.onmessage = function onmessageFunction(evt) {
		var message = evt.data;
		if (message) {
			var fromPort = connections[message.uuid];
			switch (message.type) {
				case 'redirect':
					connections[message.uuidFrom] = connections[message.uuidTo];
					break;
				case 'cartridgeID_received':
					fromPort.postMessage( { type: 'send_cartridgeID', cartridgeID: (message.cartridgeID ? message.cartridgeID : null) } );
					break;
				case 'disconnect':
					delete connections[message.uuid];
					break;
				case 'error':
					debugger;
					break;
			}
		}
		else {
			console.log('Worker port not found');
		}
	};
	
	thePort.postMessage({ type: 'connected', uuid: uuidKey });
};

console.log('ScanBarcode worker started.');