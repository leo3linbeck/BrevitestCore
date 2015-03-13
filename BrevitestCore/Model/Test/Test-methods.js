﻿var spark = require('sparkCore');model.Test.methods.start = function(param) {	// param: username, deviceID, cartridgeID	var test;	var result = {};	var cartridge = ds.Cartridge(param.cartridgeID);	var device = ds.Device(param.deviceID);	var user = ds.User.find('username === :1', param.username);		if (cartridge === null) {		result.success = false;		result.message = 'Cartridge entity not found';		result.cartridgeID = param.cartridgeID;		return result;	}		if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.deviceID = param.deviceID;		return result;	}		if (user === null) {		result.success = false;		result.message = 'User not found';		result.username = param.username;		return result;	}	else {		practice = user.practice;	}		if (device.practice.ID !== practice.ID || cartridge.practice.ID !== practice.ID) {		result.success = false;		result.message = 'Practice is not the same for user, device, and cartridge';		result.cartridgePracticeID = cartridge.practice.ID;		result.devicePracticeID = device.practice.ID;		result.userPracticeID = practice.ID;		return result;	}		result = model.Device.methods.checkSerialNumber({deviceID: device.ID});	if (!result.success) {		result.deviceID = device.ID;		return result;	}		result = spark.ready_to_run_assay(device.sparkCoreID);	if (result && (result.status === 200) && (result.response.return_value !== -1)) {		result = spark.run_test(device.sparkCoreID, cartridge.ID, cartridge.assay.BCODE);		if (result.success) {			test = ds.Test.createEntity();			test.assay = cartridge.assay;			test.device = device;			test.startedOn = new Date();			test.save();						cartridge.test = test;			cartridge.startedOn = test.startedOn;			cartridge.save();						result.testID = test.ID		}		else {			result.success = false;			result.message = 'Test failed to begin.';		}	}	else {		result.success = false;		result.message = 'Device not ready. Please initialize, load cartridge, and try again';	}		return result;};model.Test.methods.start.scope = 'public';model.Test.methods.rawDataPoints = function(param) {	// param: testID	var data, i, indx, num_readings, reading, result = [], test;		test = ds.Test(param.testID);	if (test && test.rawData) {		data = test.rawData.split('\n');		for (i = 2; i < data.length; i += 1) {			if (data[i] === '99') {				indx = i + 1;				break;			}		}		num_readings = 2 * parseInt(data[0].split('\t')[4]);		if (num_readings === indx) {			return 0;		}				r_minus_b = 0;		for (i = indx; i < num_readings + indx; i += 1) {			reading = data[i].split('\t');			result.push({				 sensor: reading[0],				 time: new Date(parseInt(reading[2])),				 clear: parseInt(reading[3]),				 red: parseInt(reading[4]),				 green: parseInt(reading[5]),				 blue: parseInt(reading[6])			});		}		return result;	}	else {		return null;	}};model.Test.methods.rawDataPoints.scope = 'public';function updateDevices(msgRef, msgPort) {	msgPort.postMessage({ type: 'update_devices', ref: msgRef });}function checkTestStatus(msgRef, msgPort, test) {	msgPort.postMessage({ type: 'check_test_status', ref: msgRef, sparkCoreID: test.device.sparkCoreID });}model.Test.methods.monitor = function(param) {	// param: testID, cartridgeID	//tmRef is a value to uniquely identify this parent thread	//it is returned by the shared worker when this thread connects	var test = ds.Test(param.testID);	if (test) {		var testID, ref, result = {};		var updateManager = new SharedWorker('Workers/SparkCoreUpdate.js', 'UpdateManager');		var thePort = updateManager.port;     //attach onmessage to port (MessagePort)		thePort.onmessage = function(event) {			var message = event.data;			//decide what the message is telling us to do			switch (message.type) {				case 'connected': 					ref = message.ref;					checkTestStatus(ref, thePort, test);					checkTestInterval = setInterval(checkTestStatus, 5000, message.ref, thePort, test);					break;				case 'test_complete':					clearInterval(checkTestInterval);					thePort.postMessage({ type: 'update_cartridge', ref: ref, cartridgeID: param.cartridgeID, sparkCoreID: test.device.sparkCoreID });					result = { success: true, message: 'Test finished' };					exitWait();					break;				case 'error':					result = { success: false, message: 'Error while monitoring test' };					exitWait();  //stop waiting for the result					break;			}	     }		wait(); //waits until a call to exitWait() in this thread		//at this point, this thread is about to end but the shared		//worker continues on		return result; //return tmInfo to the browser	}};model.Test.methods.monitor.scope = 'public';