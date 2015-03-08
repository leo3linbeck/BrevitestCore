﻿var L3 = require('L3');var secrets = require('secrets');var sparkURL = 'https://api.spark.io/v1/';var requestUUID = '';var sparkCoreListResponse = get_spark_core_list();var sparkCores = sparkCoreListResponse.success ? sparkCoreListResponse.response : [];var sparkCommand = {	'write_serial_number': '00',	'initialize_device': '01',	'run_assay': '02',	'sensor_data': '03',	'change_param': '04',	'reset_params': '05',	'erase_archive': '06',	'dump_archive': '07',	'archive_size': '08',	'firmware_version': '09',	'cancel_process': '10',	'receive_BCODE': '11',	'device_ready': '12',	'calibrate': '13'};var sparkRequest = {	'serial_number': '00',	'test_record': '01',	'test_record_by_uuid': '02',	'all_params': '03',	'one_param': '04'};var brevitestParamNames = [    'step_delay_us',    'stepper_wifi_ping_rate',    'stepper_wake_delay_ms',    'solenoid_surge_power',    'solenoid_surge_period_ms',    'solenoid_sustain_power',    'sensor_params',    'sensor_ms_between_samples',    'sensor_led_power',    'sensor_led_warmup_ms'];var BCODECommands = [	{		num: '0',		name: 'Start Assay',		description: 'Starts the assay. Required to be the first command. Assay executes until Finish Assay command. Parameters are (sensor integration time, sensor gain).'	},	{		num: '1',		name: 'Delay',		description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'	},	{		num: '2',		name: 'Move',		description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'	},	{		num: '3',		name: 'Solenoid On',		description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'	},	{		num: '4',		name: 'Device LED On',		description: 'Turns on the device LED, which is visible outside the device. No parameters.'	},	{		num: '5',		name: 'Device LED Off',		description: 'Turns off the device LED. No parameters.'	},	{		num: '6',		name: 'Device LED Blink',		description: 'Blinks the device LED at a specified rate. Parameter is (period in milliseconds between change in LED state).'	},	{		num: '7',		name: 'Sensor LED On',		description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'	},	{		num: '8',		name: 'Sensor LED Off',		description: 'Turns off the sensor LED. No parameters.'	},	{		num: '9',		name: 'Read Sensors',		description: 'Takes readings from the sensors. Parameters are (number of samples [1-10], milliseconds between samples).'	},	{		num: '10',		name: 'Read QR Code',		description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'	},	{		num: '11',		name: 'Disable Sensor',		description: 'Disables the sensors, switching them to low-power mode. No parameters.'	},	{		num: '12',		name: 'Repeat Begin',		description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'	},	{		num: '13',		name: 'Repeat End',		description: 'Ends the innermost block of repeated commands. No parameters.'	},	{		num: '14',		name: 'Status',		description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'	},	{		num: '99',		name: 'Finish Assay',		description: 'Finishes the assay. Required to be the final command. No parameters.'	}];	var brevitestParam = {};brevitestParamNames.forEach(	function (e, i) {		var s = (4 * i).toString();		brevitestParam[e] = zeropad(s, 3);	});var sparkSensorHeader = 'S\t n\t       sensor read time       \t  C  \t  R  \t  G  \t  B\n\n';////  BCODE FUNCTIONS//function convert_code_to_command(code) {	var cmd = '';	for (i = 0; i < BCODECommands.length; i += 1) {		if (BCODECommands[i].num === code) {			cmd = BCODECommands[i].name;			break;		}	}	return cmd;}function convert_BCODE_string(str) {	var c, cmd, i, indx, p;	var a = '';		if (str) {		cmd = str.split('\n');				for (i = 0; i < cmd.length; i += 1) {			if (cmd[i]) {				indx = cmd[i].indexOf(',');				if (indx === -1) {					c = cmd[i];					p = '';				}				else {					c = cmd[i].substr(0, indx);					p = cmd[i].substr(indx + 1);				}				c = convert_code_to_command(c);				a += c + Array(14 - c.length).join(' ') + '\t' + p + '\n';			}		}	}		return a;}	////  SPARK CORE FUNCTIONS//function getAccessToken(coreID) {	var result = {};//	//		DEVICE VALIDATION CODE - SAVE FOR LATER////	var rightNow = new Date();//	//	if (!coreID) {//		result.success = false;//		result.message = 'Missing coreID';//		result.coreID = coreID;//		return result;//	}//	//	var device = ds.Device.find('sparkCoreID === :1', coreID);//	if (device === null) {//		result.success = false;//		result.message = 'Device entity not found';//		result.coreID = coreID;//		return result;//	}//	//	if (!device.tokenExpiry || device.tokenExpiry < rightNow) {//		result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);//			//		device.bearerToken = result.response.access_token;//		rightNow.setTime(rightNow.getTime() + result.response.expires_in - 60000);//		device.tokenExpiry = rightNow;//		device.save();//	}//	//	result.bearerToken = device.bearerToken;//	result.tokenExpiry = device.tokenExpiry;	result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);		result.bearerToken = result.response.access_token;	result.tokenExpiry = result.response.expires_in;	if (result.bearerToken) {		result.success = true;		result.message = 'Token obtained';	}	else {	    result.success = false;    	result.message = 'Unable to obtain access token';	}		return result;};function sparkCoreConnected(coreID) {	var i;		if (sparkCores === undefined) {		get_spark_core_list();	}		for (i = 0; i < sparkCores.length; i += 1) {		if (sparkCores[i].id === coreID) {			return sparkCores[i].connected;		}	}		return false;}function call_spark_function(coreID, funcName, command, argString) {	var param, result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);				if (result.success) {			param = (funcName == 'requestdata'  ? '' : sparkCommand[command]) + (argString ? argString : '');			result = L3.post(sparkURL + 'devices/' + coreID + '/' + funcName, result.bearerToken, { args: param });		    result.success = result && result.response && result.response.return_value !== -1;		}	}	else {		result.success = false;		result.message = 'Spark core not online';	}	return result;}function get_spark_variable(coreID, varName) {	var result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);				if (result.success) {	    	result = L3.get(sparkURL + 'devices/' + coreID + '/' + varName, result.bearerToken);		    result.success = result && result.response && result.status === 200;			result.value = result.response ? result.response.result : null;		}	}	else {		result.success = false;		result.message = 'Spark core not online';	}	return result;}function get_spark_core_list() {	var result = L3.oauth('https://api.spark.io/oauth/token', 'spark', 'spark', secrets.sparkUsername, secrets.sparkPassword);	var i;		if (result.status === 200) {		result = L3.get(sparkURL + 'devices', result.response.access_token);		result.success = (result.status === 200);		if (result.success) {			sparkCores = result.response;		}	}	else {		result.success = false;	}		return result;}function get_spark_core_info(coreID) {	var result = {};		if (sparkCoreConnected(coreID)) {		result = getAccessToken(coreID);		if (result.success) {			result = L3.get(sparkURL + 'devices', result.bearerToken);		}	}		return result;}function get_spark_core_status(coreID) {	var result = {};		result = getAccessToken(coreID);	if (result.success) {		result = L3.get(sparkURL + 'devices/' + coreID, result.bearerToken);		result.success = (result.status === 200);	}		return result;}function send_BCODE_to_spark(coreID, uuid, BCODE) {	var end, i, len, max_payload, num, packets, payload, result, start;		max_payload = 56 - uuid.length; // max string = 63 - length(command code) - length(num) - length(len) - length(uuid)	packets = Math.ceil(BCODE.length / max_payload);		result = call_spark_function(coreID, 'runcommand', 'receive_BCODE', '000' + zeropad(packets, 2) + uuid);	if (result.success) {		for (i = 1; i <= packets; i += 1) {			start = (i - 1) * max_payload;			end = start + max_payload;			payload = BCODE.substring(start, end);			len = zeropad(payload.length, 2);			num = zeropad(i, 3);			result = call_spark_function(coreID, 'runcommand', 'receive_BCODE', num + len + uuid + payload);			if (!(result.success && result.response.return_value === i)) {				break;			}		}	}		return result;}function reset_spark_parameters(coreID) {	var result = call_spark_function(coreID, 'runcommand', 'reset_params');		if (result.success) {		result = request_spark_data(coreID, 'all_params');		if (result.success) {			result.data = create_attribute_data(result.value);			result.value = '';		}	}		return result;}function run_spark_test(coreID, uuid, BCODE) {	var result = send_BCODE_to_spark(coreID, uuid, BCODE);	if (result.success) {		result = call_spark_function(coreID, 'runcommand', 'run_assay', uuid);	}		return result;}////  UTLITY FUNCTIONS//function zeropad (num, numZeros) {	var an = Math.abs(num);    var digitCount = (num === 0 ? 1 : 1 + Math.floor (Math.log(an) / Math.LN10));	if (digitCount >= numZeros) {		return num;	}	var zeroString = Math.pow(10, numZeros - digitCount).toString ().substr(1);	return num < 0 ? '-' + zeroString.substr(1) + an.toString() : zeroString + an.toString();}function create_attribute_data(valueStr) {	var attrObj = [];	var attrValues = [];	var i;	attrValues = valueStr.split(',');	for (i = 0; i < attrValues.length; i += 1) {		attrObj.push(			{				'id': i + 1,				'name': brevitestParamNames[i],				'value': parseInt(attrValues[i])			}		);	}	return attrObj;}function string_to_datetime(str) {	var read_time = new Date(parseInt(str) * 1000);	return read_time.toUTCString();}function parse_sensor_reading(str) {	var data = str.split('\t');	var result = (data[0] === 'A' ? 'Assay' : 'Control') + '\t';	result += data[1] + '\t';	result += string_to_datetime(data[2]) + '\t';	result += data[3] + '\t';	result += data[4] + '\t';	result += data[5] + '\t';	result += data[6] + '\n';	return result;}function parse_test_header(str) {	var data = str.split('\t');	var result = 'TEST INFORMATION\n';	result += 'Record number: ' + data[0] + '\n';	result += 'Test start time: ' + string_to_datetime(data[1]) + '\n';	result += 'Test finish time: ' + string_to_datetime(data[2]) + '\n';	result += 'Test UUID: ' + data[3] + '\n';	result += 'Number of sensor samples: ' + data[4] + '\n';	result += 'BCODE version: ' + data[5] + '\n';	result += 'BCODE length: ' + data[6] + '\n';	result += '\n';	return result;		}function parse_test_params(str) {	var data = str.split('\t');	var result = 'DEVICE PARAMETERS\n';	result += 'step_delay_us: ' + data[0] + '\n';	result += 'stepper_wifi_ping_rate: ' + data[1] + '\n';	result += 'stepper_wake_delay_ms: ' + data[2] + '\n';	result += 'solenoid_surge_power: ' + data[3] + '\n';	result += 'solenoid_surge_period_ms: ' + data[4] + '\n';	result += 'solenoid_sustain_power: ' + data[5] + '\n';	result += 'sensor_params: ' + parseInt(data[6], 16).toString() + '\n';	result += 'sensor_ms_between_samples: ' + data[7] + '\n';	result += 'sensor_led_power: ' + data[8] + '\n';	result += 'sensor_led_warmup_ms: ' + data[9] + '\n';	result += '\n';	return result;		}function parse_test_data(test_str) {	var attr, i, i2, num_samples;	var data = test_str.split('\n');	var result = parse_test_header(data[0]);		result += parse_test_params(data[1]);		result += 'BCODE COMMANDS\n';	i = 1;	do {		i += 1;		result += convert_BCODE_string(data[i]);	} while (data[i].substr(0, 2) !== '99') ;		result += '\nSENSOR READINGS\n';	result += sparkSensorHeader;	num_samples = parseInt(test_str.substr(61, 3));	i2 = i + 1;	for (i = 0; i < (2 * num_samples); i += 1) {		result += parse_sensor_reading(data[i2 + i]);	}	return result;}function push_sensor_data(data, str) {	data.push(sparkDataHeader);	for (i = 0; i < 20; i += 1) {		data.push(parse_sensor_data(str.substr(31 * i, 31)));	}	return data;}////  DATA REQUEST//function request_spark_data(coreID, requestType, requestUUID, param) {	var arg, readResult = '', register, result = {};		if (!requestUUID) {		requestUUID = generateUUID();	}		result.response = {return_value: 0};	do {		arg = requestUUID + zeropad(result.response.return_value, 6) + sparkRequest[requestType] + (param ? param : '');		result = call_spark_function(coreID, 'requestdata', null, arg);		if (result.success && result.response.return_value !== -1) {			register = get_spark_variable(coreID, 'register');			readResult += register.value;			if (result.response.return_value === 0) {				call_spark_function(coreID, 'requestdata', null, requestUUID + '999999');				result.value = readResult;			}		}	} while (result.success && register.success && result.response.return_value > 0);		return result;};/////////////////////////////////////////////////////////////////////////////                                                                       ////                         EXPOSED FUNCTIONS                             ////                                                                       /////////////////////////////////////////////////////////////////////////////////   REQUESTS//exports.request_configuration = function request_configuration(coreID) {	return request_spark_data(coreID, 'config_info');};exports.request_test_data = function request_test_data(coreID, num) {	var indx, r;		indx = 0;	r = request_spark_data(coreID, 'test_record', null, zeropad(num - 1, 3));	if (r.success) {		r.value = parse_test_data(r.value);	}		return r;};exports.request_test_data_by_uuid = function request_test_data(coreID, uuid) {	return request_spark_data(coreID, 'test_record_by_uuid', uuid);};exports.request_parameter = function request_parameter(coreID, paramName) {	return request_spark_data(coreID, 'one_param', null, brevitestParam[paramName]);};exports.request_all_parameters = function request_all_parameters(coreID) {	var result = request_spark_data(coreID, 'all_params');		if (result.success) {		result.data = create_attribute_data(result.value);		result.value = '';	}		return result;};////  COMMANDS//exports.initialize_device = function initialize_device(coreID) {	return call_spark_function(coreID, 'runcommand', 'initialize_device');};exports.run_test = function run_test(coreID, uuid, BCODE) {	return run_spark_test(coreID, uuid, BCODE);};exports.collect_sensor_data = function collect_sensor_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'sensor_data');};exports.change_parameter = function change_parameter(coreID, paramName, paramValue) {	return call_spark_function(coreID, 'runcommand', 'change_param', brevitestParam[paramName] + paramValue);};exports.reset_parameters = function reset_parameters(coreID) {	return reset_spark_parameters(coreID);};exports.get_list_of_cores = function get_list_of_cores() {	return get_spark_core_list();}exports.get_core_info = function get_core_info(coreID) {	return get_spark_core_info(coreID);}exports.get_core_status = function get_core_status(coreID) {	return get_spark_core_status(coreID);}exports.get_status = function get_status(coreID) {	return get_spark_variable(coreID, 'status');}exports.test_running = function test_running(coreID) {	return get_spark_variable(coreID, 'testrunning');}exports.erase_archived_data = function erase_archived_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'erase_archive');};exports.dump_archived_data = function dump_archived_data(coreID) {	return call_spark_function(coreID, 'runcommand', 'dump_archive');};exports.get_archive_size = function get_archive_size(coreID) {	return call_spark_function(coreID, 'runcommand', 'archive_size');};exports.get_firmware_version = function get_firmware_version(coreID) {	return call_spark_function(coreID, 'runcommand', 'firmware_version');};exports.cancel_process = function cancel_process(coreID) {	return call_spark_function(coreID, 'runcommand', 'cancel_process');};exports.ready_to_run_assay = function ready_to_run_assay(coreID) {	return call_spark_function(coreID, 'runcommand', 'device_ready');};exports.write_serial_number = function write_serial_number(coreID, serialNumber) {	return call_spark_function(coreID, 'runcommand', 'write_serial_number', serialNumber);};exports.read_serial_number = function read_serial_number(coreID) {	return request_spark_data(coreID, 'serial_number');};exports.set_and_move_to_calibration_point = function set_and_move_to_calibration_point(coreID, calibrationSteps) {	return call_spark_function(coreID, 'runcommand', 'calibrate', calibrationSteps);};exports.get_BCODE_commands = function get_BCODE_commands(str) {	return ( {success: true, commands: BCODECommands} );}