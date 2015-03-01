﻿var L3 = require('L3');var secrets = require('secrets');var sparkURL = 'https://api.spark.io/v1/';var requestUUID = '';var sparkCores;var sparkCommand = {	'write_serial_number': '00',	'initialize_device': '01',	'run_assay': '02',	'sensor_data': '03',	'change_param': '04',	'reset_params': '05',	'erase_archive': '06',	'dump_archive': '07',	'archive_size': '08',	'firmware_version': '09',	'cancel_process': '10'};var sparkRequest = {	'serial_number': '00',	'all_sensor_data': '01',	'sensor_datum': '02',	'archived_header': '03',	'archived_data': '04',	'all_params': '05',	'one_param': '06'};var brevitestParamNames = [    'step_delay_raster_us',    'step_delay_transit_us',    'step_delay_reset_us',    'steps_per_raster',    'stepper_wifi_ping_rate',    'stepper_wake_delay_ms',    'solenoid_surge_power',    'solenoid_surge_period_ms',    'solenoid_sustain_power',    'solenoid_off_ms',    'solenoid_on_ms',    'solenoid_first_off_ms',    'solenoid_first_on_ms',    'solenoid_finish_well_ms',    'solenoid_cycles_per_raster',    'sensor_params',    'sensor_number_of_collections',    'sensor_ms_between_samples',    'led_power',    'led_warmup_ms',    'steps_to_reset',    'steps_to_sample_well',    'sample_well_rasters',    'steps_to_antibody_well',    'antibody_well_rasters',    'steps_to_first_buffer_well',    'first_buffer_well_rasters',    'steps_to_enzyme_well',    'enzyme_well_rasters',    'steps_to_second_buffer_well',    'second_buffer_well_rasters',    'steps_to_indicator_well',    'indicator_well_rasters',    'step_delay_meniscus_us',    'steps_for_meniscus_transition',    'solenoid_start_well_ms'];var brevitestParam = {};brevitestParamNames.forEach(	function (e, i) {		var s = (4 * i).toString();		brevitestParam[e] = zeropad(s, 3);	});var sparkDataHeader = 'S\t n\t       sensor read time       \t  C  \t  R  \t  G  \t  B';var sparkHeaderHeader = '   n\t   addr  \tlen\t     assay start time';////  SPARK CORE FUNCTIONS//function getAccessToken(coreID) {	var result = {};//	//		DEVICE VALIDATION CODE - SAVE FOR LATER////	var rightNow = new Date();//	//	if (!coreID) {//		result.success = false;//		result.message = 'Missing coreID';//		result.coreID = coreID;//		return result;//	}//	//	var device = ds.Device.find('sparkCoreID === :1', coreID);//	if (device === null) {//		result.success = false;//		result.message = 'Device entity not found';//		result.coreID = coreID;//		return result;//	}//	//	if (!device.tokenExpiry || device.tokenExpiry < rightNow) {//		result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);//			//		device.bearerToken = result.response.access_token;//		rightNow.setTime(rightNow.getTime() + result.response.expires_in - 60000);//		device.tokenExpiry = rightNow;//		device.save();//	}//	//	result.bearerToken = device.bearerToken;//	result.tokenExpiry = device.tokenExpiry;	result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);		result.bearerToken = result.response.access_token;	result.tokenExpiry = result.response.expires_in;	if (result.bearerToken) {		result.success = true;		result.message = 'Token obtained';	}	else {	    result.success = false;    	result.message = 'Unable to obtain access token';	}		return result;};function sparkCoreConnected(coreID) {	var i;		for (i = 0; i < sparkCores.length; i += 1) {		if (sparkCores[i].id === coreID) {			return sparkCores[i].connected;		}	}		return false;}function call_spark_function(coreID, funcName, command, argString) {	var param, result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);				if (result.success) {			param = (funcName == 'requestdata'  ? '' : sparkCommand[command]) + (argString ? argString : '');			result = L3.post(sparkURL + 'devices/' + coreID + '/' + funcName, result.bearerToken, { args: param });		    result.success = result && result.response && result.response.return_value !== -1;		}	}	else {		result.success = false;		result.message = 'Spark core not online';	}	return result;}function get_spark_variable(coreID, varName) {	var result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);				if (result.success) {	    	result = L3.get(sparkURL + 'devices/' + coreID + '/' + varName, result.bearerToken);		    result.success = result && result.response && result.status === 200;			result.value = result.response ? result.response.result : null;		}	}	else {		result.success = false;		result.message = 'Spark core not online';	}	return result;}function get_spark_core_list() {	var result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);	var i;		if (result.status === 200) {		result = L3.get(sparkURL + 'devices', result.response.access_token);		result.success = (result.status === 200);		if (result.success) {			sparkCores = result.response;		}	}	else {		result.success = false;	}		return result;}function get_spark_core_info(coreID) {	var result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);		if (result.success) {			result = L3.get(sparkURL + 'devices', result.bearerToken);		}	}		return result;}function get_spark_core_status(coreID) {	var result = {};		result = getAccessToken(coreID);	if (result.success) {		result = L3.get(sparkURL + 'devices/' + coreID, result.bearerToken);		result.success = (result.status === 200);	}		return result;}function send_message_to_spark(coreID, uuid, msg) {	var end, i, len, max_payload, num, packets, payload, result, start;		max_payload = 63 - uuid.length;	packets = Math.ceil(msg.length / max_payload);		for (i = 0; i < packets; i += 1) {		start = i * max_payload;		end = start + max_payload - 1;		payload = msg.substring(start, end);		len = zeropad(payload.length, 2);		num = zeropad(i, 3);		result = call_spark_function(coreID, 'runcommand', 'receive_message', num + len + uuid + payload);		if (!(result.success && result.response.return_value === i)) {			break;		}	}}////  UTLITY FUNCTIONS//function zeropad (num, numZeros) {	var an = Math.abs (num);    var digitCount = 1 + Math.floor (Math.log (an) / Math.LN10);	if (digitCount >= numZeros) {		return num;	}	var zeroString = Math.pow(10, numZeros - digitCount).toString ().substr(1);	return num < 0 ? '-' + zeroString.substr(1) + an : zeroString + an;}function create_attribute_data(valueStr) {	var attrObj = [];	var attrValues = [];	var i;	attrValues = valueStr.split(',');	for (i = 0; i < attrValues.length; i += 1) {		attrObj.push(			{				'id': i + 1,				'name': brevitestParamNames[i],				'value': parseInt(attrValues[i])			}		);	}	return attrObj;}function hex_string_to_datetime(str) {	var read_secs = parseInt('0x' + str.toUpperCase());	var read_time = new Date(read_secs * 1000);	return read_time.toUTCString();}function parse_sensor_data(str) {	var read_secs, read_time;	var result = str[0] + '\t';	result += str.substr(1, 2) + '\t';	result += hex_string_to_datetime(str.substr(3, 8)) + '\t';	result += str.substr(11, 5) + '\t';	result += str.substr(16, 5) + '\t';	result += str.substr(21, 5) + '\t';	result += str.substr(26, 5);		return result;}function parse_sensor_header(header_str) {	var attr, str;	var result = '';	var indx = header_str.indexOf('\n');	if (indx !== -1) {		str = header_str.substring(indx + 1);		values = str.split(',');				for (i = 0; i < brevitestParamNames.length; i += 1) {			result += brevitestParamNames[i] + ': ' + values[i] + (i < (brevitestParamNames.length-1) ? '\n' : '');		}		result += '\n\n' + sparkHeaderHeader + '\n';		str = header_str.substring(0, indx);		result += str.substr(0, 4) + '\t';		result += '0x' + str.substr(4, 8).toUpperCase() + '\t';		result += str.substr(12, 2) + '\t';		result += hex_string_to_datetime(str.substr(14, 8));			}		return result;}function push_sensor_data(data, str) {	data.push(sparkDataHeader);	for (i = 0; i < 20; i += 1) {		data.push(parse_sensor_data(str.substr(31 * i, 31)));	}	return data;}////  DATA REQUEST//function request_spark_data(coreID, requestType, param) {	var requestUUID = generateUUID();	var arg = requestUUID + sparkRequest[requestType] + (param ? param : '');	var result = call_spark_function(coreID, 'requestdata', null, arg);	if (result.response.return_value !== -1) {		result = get_spark_variable(coreID, 'register');		call_spark_function(coreID, 'requestdata', null, requestUUID);	}		return result;};////  EXPOSED FUNCTIONS//exports.request_configuration = function request_configuration(coreID) {	return request_spark_data(coreID, 'config_info');};exports.request_all_sensor_data = function request_all_sensor_data(coreID) {	var i, r, str, temp;	var data = [];		r = request_spark_data(coreID, 'all_sensor_data');	if (r.success) {		r.data = push_sensor_data(data, r.value);	}		return r;};exports.request_last_assay_data = function request_last_assay_data(coreID, num) {	var r;	var data = [];		num = call_spark_function(coreID, 'runcommand', 'archive_size');	if (num > 0) {		r = request_spark_data(coreID, 'archived_header', num);		if (r.success) {			r.header = parse_sensor_header(r.value);			r = request_spark_data(coreID, 'archived_data', num);			if (r.success) {				push_sensor_data(data, r.value);			}			r.data = data;		}		}	else {		r = {			success: false, 			message: 'No archived assay records found'		};	}	return r;};exports.request_archive_data = function request_archive_data(coreID, num) {	var r;	var data = [];		if (num >= 0) {		num = num % 512;		r = request_spark_data(coreID, 'archived_header', num);		if (r.success) {			data.push(parse_sensor_header(r.value));		}		data.push('\n\n');		r = request_spark_data(coreID, 'archived_data', num);		if (r.success) {			push_sensor_data(data, r.value);		}	}		r.data = data;	return r;};exports.write_serial_number = function write_serial_number(coreID, serialNumber) {	return call_spark_function(coreID, 'runcommand', 'write_serial_number', serialNumber);};exports.initialize_device = function initialize_device(coreID) {	return call_spark_function(coreID, 'runcommand', 'initialize_device');};exports.run_assay = function run_assay(coreID) {	return call_spark_function(coreID, 'runcommand', 'run_assay');};exports.collect_sensor_data = function collect_sensor_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'sensor_data');};exports.request_parameter = function request_parameter(coreID, paramName) {	return request_spark_data(coreID, 'one_param' + brevitestParam[paramName]);};exports.request_all_parameters = function request_all_parameters(coreID) {	var result = request_spark_data(coreID, 'all_params');		if (result.success) {		result.data = create_attribute_data(result.value);		result.value = '';	}		return result;};exports.change_parameter = function change_parameter(coreID, paramName, paramValue) {	return call_spark_function(coreID, 'runcommand', 'change_param', brevitestParam[paramName] + paramValue);};exports.reset_parameters = function reset_parameters(coreID) {	var result = call_spark_function(coreID, 'runcommand', 'reset_params');		if (result.success) {		result = request_spark_data(coreID, 'all_params');		if (result.success) {			result.data = create_attribute_data(result.value);			result.value = '';		}	}		return result;};exports.get_list_of_cores = function get_list_of_cores() {	return get_spark_core_list();}exports.get_core_info = function get_core_info(coreID) {	return get_spark_core_info(coreID);}exports.get_core_status = function get_core_status(coreID) {	return get_spark_core_status(coreID);}exports.get_status = function get_status(coreID) {	return get_spark_variable(coreID, 'status');}exports.assay_running = function assay_running(coreID) {	return get_spark_variable(coreID, 'assayrunning');}exports.erase_archived_data = function erase_archived_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'erase_archive');};exports.dump_archived_data = function dump_archived_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'dump_archive');};exports.get_archive_size = function get_archive_size(coreID) {	return call_spark_function(coreID, 'runcommand', 'archive_size');};exports.get_firmware_version = function get_firmware_version(coreID) {	return call_spark_function(coreID, 'runcommand', 'firmware_version');};exports.cancel_process = function cancel_process(coreID) {	return call_spark_function(coreID, 'runcommand', 'cancel_process');};exports.ready_to_run_assay = function ready_to_run_assay(coreID) {	return call_spark_function(coreID, 'runcommand', 'device_ready');};exports.read_serial_number = function read_serial_number(coreID) {	return request_spark_data(coreID, 'serial_number');};