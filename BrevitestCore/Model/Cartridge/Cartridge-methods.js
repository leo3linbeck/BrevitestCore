﻿model.Cartridge.methods.manufacture = function(param) {	// param: username, assayID, quantity	var assay = ds.Assay(param.assayID);	var user = ds.User.find('username === :1', param.username);	var c, i;	if (assay && user) {		for (i = 0; i < param.quantity; i += 1) {			c = ds.Cartridge.createEntity();			c.manufacturedOn = new Date();			c.assay = assay;			c.practice = user.practice;			c.save();		}				return param.quantity;	}	else {		return 0;	}};model.Cartridge.methods.manufacture.scope = 'public';model.Cartridge.methods.register = function(param) {	// param: username, cartridgeID	var cartridge = ds.Cartridge(param.cartridgeID);	var user = ds.User.find('username === :1', param.username);	if (cartridge && user) {		cartridge.registeredOn = new Date();		cartridge.registeredBy = user;		cartridge.save();		return 1;	}	else {		return 0;	}};model.Cartridge.methods.register.scope = 'public';model.Cartridge.methods.start_scan = function() {	var result = {};	var barcodeManager = new SharedWorker('Workers/ScanBarcode.js', 'BarcodeScanManager');	var thePort = barcodeManager.port;     //attach onmessage to port (MessagePort)	thePort.onmessage = function(event) {		var message = event.data;		//decide what the message is telling us to do		switch (message.type) {			case 'connected': 				result = { success: true, uuid: message.uuid };				exitWait();				break;			case 'error':				result = { success: false, message: 'Error while monitoring test' };				exitWait();				break;		}     }	wait();		return result; //return tmInfo to the browser};model.Cartridge.methods.start_scan.scope = 'public';model.Cartridge.methods.wait_for_scan_result = function(param) {	// param: uuid for scan worker	var result = {};	var barcodeManager = new SharedWorker('Workers/ScanBarcode.js', 'BarcodeScanManager');	var thePort = barcodeManager.port;     //attach onmessage to port (MessagePort)	thePort.onmessage = function(event) {		var message = event.data;		//decide what the message is telling us to do		switch (message.type) {			case 'connected':				thePort.postMessage({ type: 'redirect', uuidFrom: param.uuid, uuidTo: message.uuid });				break;			case 'send_cartridgeID':				result = { success: true, cartridgeID: message.cartridgeID };				exitWait();				break;			case 'error':				result = { success: false, message: 'Error while waiting for scan results' };				exitWait();  //stop waiting for the result				break;		}     }	wait(); //waits until a call to exitWait() in this thread	//at this point, this thread is about to end but the shared	//worker continues on	return result; //return tmInfo to the browser};model.Cartridge.methods.wait_for_scan_result.scope = 'public';