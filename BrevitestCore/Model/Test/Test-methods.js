﻿var spark = require('sparkCore');model.Test.methods.start = function(param) {	var result = {};	var practice, prescription, status;	var test = ds.Test(param.testID);	var device = ds.Device(param.deviceID);	var user = ds.User.find('username === :1', param.username);		if (test === null) {		result.success = false;		result.message = 'Test entity not found';		result.testID = param.testID;		return result;	}	else {		prescription = test.prescription;	}		if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.deviceID = param.deviceID;		return result;	}		if (user === null) {		result.success = false;		result.message = 'User not found';		result.username = param.username;		return result;	}	else {		practice = user.practice;	}		if (device.practice.ID !== practice.ID || prescription.physician.practice.ID !== practice.ID) {		result.success = false;		result.message = 'Practice is not the same for user, device, and test';		result.testPracticeID = prescription.physician.practice.ID;		result.devicePracticeID = device.practice.ID;		result.userPracticeID = practice.ID;		return result;	}		result = model.Device.methods.checkSerialNumber({deviceID: device.ID});	if (!result.success) {		result.deviceID = device.ID;		return result;	}		result = spark.ready_to_run_assay(device.sparkCoreID);	if (result && (result.status === 200) && (result.response.return_value !== -1)) {		result = spark.run_assay(device.sparkCoreID);	}	else {		result.success = false;		result.message = 'Device not ready. Please initialize, load cartridge, and try again';	}		if (result.success) {		test.device = device;		test.startedOn = new Date();		test.save();	}	return result;};model.Test.methods.start.scope = 'public';model.Test.methods.updateStatus = function() {	//  query the existing Shared Worker that is started up from the bootstrap JS	//  to obtain the time of the most recent backup	var tmRef = 0;	var theWorker = new SharedWorker("Workers/SparkCoreUpdate.js", "SparkCoreUpdateThread");	var thePort = theWorker.port; //MessagePort	var result = '';  //  variable is updated within the onmessage function()			thePort.onmessage = function(event) {		var message = event.data;		switch (message.type)		{			case 'connected':  //  initial connection to shared worker thread  	  			tmRef = message.ref;    			thePort.postMessage({type: 'report', ref: tmRef});  //  request last backup time    			break;			case 'update':  //  requested information received from SharedWorker           		thePort.postMessage({type: 'disconnect', ref: tmRef});  //  tell SharedWorker we're done    			exitWait();  //  allow function to complete past wait() statement    			break;			case 'error':  //  error message received				result = 'Error received from update shared worker process.';           		exitWait();    			break;		}	};		wait();//waits until a call to exitWait() in this thread	//allows to handle incoming messages on the onmessage	return result;				};model.Test.methods.updateStatus.scope = 'public';