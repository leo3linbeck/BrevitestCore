﻿var L3 = require('L3');var secrets = require('secrets');var sparkURL = 'https://api.spark.io/v1/';var requestUUID = '';var sparkCores = {};var sparkCoreNames = [];var sparkCommand = {	'write_serial_number': '00',	'initialize_device': '01',	'run_assay': '02',	'sensor_data': '03',	'change_param': '04',	'reset_params': '05'};var sparkRequest = {	'serial_number': '00',	'all_sensor_data': '01',	'sensor_datum': '02',	'archived_data': '03',	'one_param': '04',	'all_params': '05'};var brevitestParam = {    'step_delay_raster_us': '000',  // microseconds    'step_delay_transit_us': '004',  // microseconds    'step_delay_reset_us': '008',  // microseconds    'steps_per_raster': '012',    'stepper_wifi_ping_rate': '016',    'stepper_wake_delay_ms': '020',    'solenoid_surge_power': '024',    'solenoid_surge_period_ms': '028',    'solenoid_sustain_power': '032',    'solenoid_off_ms': '036',    'solenoid_on_ms': '040',    'solenoid_first_off_ms': '044',    'solenoid_first_on_ms': '048',    'solenoid_finish_well_ms': '052',    'solenoid_cycles_per_raster': '056',    'sensor_params': '060',    'sensor_number_of_collections': '064',    'sensor_ms_between_samples': '068',    'led_power': '072',    'led_warmup_ms': '076',    'steps_to_reset': '080',    'steps_to_sample_well': '084',    'sample_well_rasters': '088',    'steps_to_antibody_well': '092',    'antibody_well_rasters': '096',    'steps_to_first_buffer_well': '100',    'first_buffer_well_rasters': '104',    'steps_to_enzyme_well': '108',    'enzyme_well_rasters': '112',    'steps_to_second_buffer_well': '116',    'second_buffer_well_rasters': '120',    'steps_to_indicator_well': '124',    'indicator_well_rasters': '128'};var sparkDataHeader = 'S\tn\t     t\t\t C\t R\t G\t B';exports.getAccessToken = getAccessToken;////  SPARK CORE FUNCTIONS//function getAccessToken(coreID) {	var result = {};//	//		DEVICE VALIDATION CODE - SAVE FOR LATER////	var rightNow = new Date();//	//	if (!coreID) {//		result.success = false;//		result.message = 'Missing coreID';//		result.coreID = coreID;//		return result;//	}//	//	var device = ds.Device.find('sparkCoreID === :1', coreID);//	if (device === null) {//		result.success = false;//		result.message = 'Device entity not found';//		result.coreID = coreID;//		return result;//	}//	//	if (!device.tokenExpiry || device.tokenExpiry < rightNow) {//		result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);//			//		device.bearerToken = result.response.access_token;//		rightNow.setTime(rightNow.getTime() + result.response.expires_in - 60000);//		device.tokenExpiry = rightNow;//		device.save();//	}//	//	result.bearerToken = device.bearerToken;//	result.tokenExpiry = device.tokenExpiry;	result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);		result.bearerToken = result.response.access_token;	result.tokenExpiry = result.response.expires_in;	if (result.bearerToken) {		result.success = true;		result.message = 'Token obtained';	}	else {	    result.success = false;    	result.message = 'Unable to obtain access token';	}		return result;};function call_spark_function(coreID, funcName, command, argString) {	var result = getAccessToken(coreID);	var param;		if (result.success) {		param = (funcName == 'requestdata' ? '' : sparkCommand[command]) + (argString ? argString : '');		result = L3.post(sparkURL + 'devices/' + coreID + '/' + funcName, result.bearerToken, { args: param });	    result.success = result && result.response && result.response.return_value !== -1;	}	return result;}function get_spark_variable(coreID, varName) {	var result = getAccessToken(coreID);		if (result.success) {    	result = L3.get(sparkURL + 'devices/' + coreID + '/' + varName, result.bearerToken);	    result.success = result && result.response && result.status === 200;		result.value = result.response ? result.response.result : null;	}	return result;}function get_spark_core_list() {	var result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);	var i;		if (result.status === 200) {		result = L3.get(sparkURL + 'devices', result.response.access_token);		result.success = (result.status === 200);	}	else {		result.success = false;	}		return result;}function get_spark_core_info(coreID) {	var result = getAccessToken(coreID);		if (result.success) {		result = L3.get(sparkURL + 'devices', result.bearerToken);	}		return result;}function create_attribute_data(valueStr) {	var attrNames = Object.keys(brevitestParam);	var attrObj = [];	var attrValues = [];	var i;	attrValues = valueStr.split(',');	for (i = 0; i < attrValues.length; i += 1) {		attrObj.push(			{				'id': i + 1,				'name': attrNames[i],				'value': attrValues[i]			}		);	}	return attrObj;}////  DATA REQUEST//function requestData(coreID, requestType) {	var retries = 5;	var requestUUID = generateUUID();	var result = call_spark_function(coreID, 'requestdata', null, requestUUID + sparkRequest[requestType]);	while (result.value === -1 && retries > 0) {		result = call_spark_function(coreID, 'requestdata', null, requestUUID + sparkRequest[requestType]);		retries -= 1;	}	if (retries !== 0) {		result = get_spark_variable(coreID, 'register');		call_spark_function(coreID, 'requestdata', null, requestUUID);	}		return result;};////  EXPOSED FUNCTIONS//exports.request_serial_number = function request_serial_number(coreID) {	return requestData(coreID, 'serial_number');};exports.request_all_sensor_data = function request_all_sensor_data(coreID) {	var r;	var data = [];		data.push(sparkDataHeader);	r = requestData(coreID, 'all_sensor_data');	if (r.success) {		data.push(r.value);	}	r.data = data;	return r;};exports.request_sensor_data = function request_sensor_data(coreID, code) {	var c, i, r, x;	var codes = []	var data = [];		data.push(sparkDataHeader);	codes = code.split(',');	for (i = 0; i < codes.length; i += 1) {		c = codes[i];		x = 2 * parseInt(c.substring(1).trim()) + (c[0].toUpperCase() === 'A' ? 0 : 1);		r = requestData(coreID, 'sensor_datum' + x);		if (r.success) {			data.push(r.value);		}	}			r.data = data;	return r;};exports.write_serial_number = function write_serial_number(coreID, serialNumber) {	return call_spark_function(coreID, 'runcommand', 'write_serial_number', serialNumber);};exports.initialize_device = function initialize_device(coreID) {	return call_spark_function(coreID, 'runcommand', 'initialize_device');};exports.run_assay = function run_assay(coreID) {	return call_spark_function(coreID, 'runcommand', 'run_assay');};exports.collect_sensor_data = function collect_sensor_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'sensor_data');};exports.request_parameter = function request_parameter(coreID, paramName) {	return requestData(coreID, 'one_param' + brevitestParam[paramName]);};exports.request_all_parameters = function request_all_parameters(coreID) {	var result = requestData(coreID, 'all_params');		if (result.success) {		result.data = create_attribute_data(result.value);		result.value = '';	}		return result;};exports.change_parameter = function change_parameter(coreID, paramName, paramValue) {	return call_spark_function(coreID, 'runcommand', 'change_param', brevitestParam[paramName] + paramValue);};exports.reset_parameters = function reset_parameters(coreID) {	var result = call_spark_function(coreID, 'runcommand', 'reset_params');		if (result.success) {		result = requestData(coreID, 'all_params');		if (result.success) {			result.data = create_attribute_data(result.value);			result.value = '';		}	}		return result;};exports.get_list_of_cores = function get_list_of_cores() {	return get_spark_core_list();}exports.get_core_info = function get_core_info(coreID) {	return get_spark_core_info(coreID);}exports.get_status = function get_status(coreID) {	return get_spark_variable(coreID, 'status');}