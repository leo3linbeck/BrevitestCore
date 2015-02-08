﻿var L3 = require('L3');var secrets = require('secrets');var sparkURL = 'https://api.spark.io/v1/';var requestUUID = '';exports.getAccessToken = getAccessToken;////  SPARK CORE FUNCTIONS//function getAccessToken(coreID) {	var result = {};	var rightNow = new Date();		if (!coreID) {		result.success = false;		result.message = 'Missing coreID';		result.coreID = coreID;		return result;	}		var device = ds.Device.find('sparkCoreID === :1', coreID);	if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.coreID = coreID;		return result;	}		if (!device.tokenExpiry || device.tokenExpiry < rightNow) {		result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);					device.bearerToken = result.response.access_token;		rightNow.setTime(rightNow.getTime() + result.response.expires_in - 60000);		device.tokenExpiry = rightNow;		device.save();	}		result.bearerToken = device.bearerToken;	result.tokenExpiry = device.tokenExpiry;	if (result.bearerToken) {		result.success = true;		result.message = 'Token obtained';	}	else {	    result.success = false;    	result.message = 'Unable to obtain access token';	}		return result;};function call_spark_function(coreID, funcName, argString) {	var result = getAccessToken(coreID);		if (result.success) {		if (argString === undefined) {			result = L3.post(sparkURL + 'devices/' + coreID + '/' + funcName, result.bearerToken);		}		else {			result = L3.post(sparkURL + 'devices/' + coreID + '/' + funcName, result.bearerToken, { args: argString });		}	    result.success = result && result.response && result.response.return_value !== -1;	}	return result;}function get_spark_variable(coreID, varName) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/' + varName, result.bearerToken);	    result.success = result && result.response && result.status === 200;		result.value = result.response ? result.response.result : null;	}	return result;}////  UTILITY FUNCTIONS//function requestData(coreID, requestCode) {	var retries = 5;	var requestUUID = generateUUID();	var result = call_spark_function(coreID, 'requestdata', requestUUID + requestCode);	while (result.value === -1 && retries > 0) {		result = call_spark_function(coreID, 'requestdata', requestUUID + requestCode);		retries -= 1;	}	if (retries !== 0) {		result = get_spark_variable(coreID, 'register')		call_spark_function(coreID, 'requestdata', requestUUID);	}		return result;};////  EXPOSED FUNCTIONS//exports.write_serial_number = function write_serial_number(coreID, serialNumber) {	return call_spark_function(coreID, 'writeserial', serialNumber);};exports.read_serial_number = function read_serial_number(coreID) {	return requestData(coreID, '00');};exports.read_sensor_data = function read_sensor_data(coreID) {	var i, r;	var data = [];		for (i = 0; i < 20; i += 1) {		r = requestData(coreID, '01' + i);		if (r.success) {			data.push(r.value);		}		else {			break;			}	}		r.data = data;	return r;};exports.initialize_device = function initialize_device(coreID) {	return call_spark_function(coreID, 'initdevice');};exports.run_assay = function run_assay(coreID) {	return call_spark_function(coreID, 'runassay');};exports.get_status = function get_status(coreID) {	return get_spark_variable(coreID, 'status');};