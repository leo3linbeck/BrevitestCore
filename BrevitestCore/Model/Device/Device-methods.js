﻿var spark = require('sparkCore');model.Device.methods.checkSerialNumber = function(param) {	var result = {};	var device = ds.Device(param.deviceID);		if (device) {		result = spark.read_serial_number(device.sparkCoreID);				if (result.success && result.value !== device.serialNumber) {			result.success = false;			result.message = 'Serial number mismatch';		}	}	else {		result.success = false;		result.message = 'Serial number error: device not found';	}	return result;};model.Device.methods.checkSerialNumber.scope = 'public';model.Device.methods.initialize = function(param) {	var result = {};	var practice, prescription, status;	var device = ds.Device(param.deviceID);	var user = ds.User.find('username === :1', param.username);			if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.deviceID = param.deviceID;		return result;	}		if (user === null) {		result.success = false;		result.message = 'User not found';		result.username = param.username;		return result;	}	else {		practice = user.practice;	}		if (device.practice.ID !== practice.ID) {		result.success = false;		result.message = 'This device is not registered to this practice';		result.devicePracticeID = device.practice.ID;		result.userPracticeID = practice.ID;		return result;	}		result = model.Device.methods.checkSerialNumber({deviceID: device.ID});	if (!result.success) {		result.deviceID = device.ID;		return result;	}		result = spark.initialize_device(device.sparkCoreID);	if (result && (result.status === 200) && (result.response.return_value !== -1)) {		result.success = true;	}	else {		result.success = false;		result.message = 'Device initialization not started';	}		return result;};model.Device.methods.initialize.scope = 'public';model.Device.methods.register = function(param) {	// param: username, deviceID, sparkCoreID, sparkCoreName, sparkCoreLastHeard, serialNumber	var result = {};	var practice;	var device = ds.Device(param.deviceID);	var user = ds.User.find('username === :1', param.username);			if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.deviceID = param.deviceID;		return result;	}		if (user === null) {		result.success = false;		result.message = 'User not found';		result.username = param.username;		return result;	}	else {		practice = user.practice;	}		result = spark.write_serial_number(param.sparkCoreID, param.serialNumber);	if (result.success) {		device.practice = practice;		device.sparkCoreID = param.sparkCoreID;		device.sparkName = param.sparkCoreName;		device.sparkLastHeard = param.sparkCoreLastHeard;		device.serialNumber = param.serialNumber;		device.registeredBy = user;		device.registeredOn = new Date();		device.online = true;		device.save();						result.deviceID = device.ID;		return result;	}	return result;};model.Device.methods.register.scope = 'public';model.Device.methods.checkCalibration = function(param) {	// param: username, deviceID	var result = {};	var practice;	var device = ds.Device(param.deviceID);	var user = ds.User.find('username === :1', param.username);			if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.deviceID = param.deviceID;		return result;	}		if (user === null) {		result.success = false;		result.message = 'User not found';		result.username = param.username;		return result;	}		if (device.practice.ID === user.practice.ID) {		result = spark.set_and_move_to_calibration_point(device.sparkCoreID, device.calibrationSteps);	}	else {		result.success = false;		result.message = 'This device is not registered to this practice';		result.devicePracticeID = device.practice.ID;		result.userPracticeID = user.practice.ID;	}	return result;};model.Device.methods.checkCalibration.scope = 'public';