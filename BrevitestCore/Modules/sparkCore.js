﻿var L3 = require('L3');var secrets = require('secrets');var sparkURL = "https://api.spark.io/v1/";function getAccessToken(coreID) {	var result = {};	var rightNow = new Date();		if (!coreID) {		result.success = false;		result.message = 'Missing coreID';		result.coreID = coreID;		return result;	}		var device = ds.Device.find('sparkCoreID === :1', coreID);	if (device === null) {		result.success = false;		result.message = 'Device entity not found';		result.coreID = coreID;		return result;	}		if (!device.tokenExpiry || device.tokenExpiry < rightNow) {		result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);					device.bearerToken = result.response.access_token;		rightNow.setTime(rightNow.getTime() + result.response.expires_in - 60000);		device.tokenExpiry = rightNow;		device.save();	}		result.bearerToken = device.bearerToken;	result.tokenExpiry = device.tokenExpiry;	if (result.bearerToken) {		result.success = true;		result.message = 'Token obtained';	}	else {	    result.success = false;    	result.message = 'Unable to obtain access token';	}		return result;};//exports.writeSerialNumber = function writeSerialNumber(coreID, serialNumber) {//	var result = getAccessToken(coreID);//	//	if (result.success) {//		result = L3.post(sparkURL + 'devices/' + coreID + '/write_serial', result.bearerToken, { args: serialNumber });//	    result.success = result && result.response && result.response.return_value === 0;//	}//	return result;//};exports.readSerialNumber = function readSerialNumber(coreID) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/serialnumber', result.bearerToken);	    result.success = result && result.response && result.status === 200 && result.response.result.length === 19;		result.serialNumber = result.response ? result.response.result : null;	}	return result;};exports.queueCommand = function queueCommand(coreID, command) {	var result = getAccessToken(coreID);		if (result.success) {	    result = L3.post(sparkURL + 'devices/' + coreID + '/queue', result.bearerToken, { args: command });	    result.success = result && result.response && result.status === 200 && result.response.return_value !== 0;		result.testID = result.response ? result.response.result : null;	}	return result;};exports.getQueueLength = function getQueueLength(coreID) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/queuelength', result.bearerToken);	    result.success = result && result.response && result.status === 200;		result.queueLength = result.response ? result.response.result : null;	}	return result;};exports.getStatus = function getStatus(coreID) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/status', result.bearerToken);	    result.success = result && result.response && result.status === 200;		result.deviceStatus = result.response ? result.response.result : null;	}	return result;};exports.getPercentComplete = function getPercentComplete(coreID) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/percentdone', result.bearerToken);	    result.success = result && result.response && result.status === 200;		result.percentComplete = result.response ? result.response.result : null;	}	return result;};