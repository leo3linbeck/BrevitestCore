var spark = require('sparkCore');
var shouldTerminate;

onmessage = function(e) {
	var result = {};
	var data = e.data;
	var message = data.message;
	var param = data.param;
	
	shouldTerminate = e.data.shouldTerminate ? true : false;
	try {
		if (data.message === 'start') {
			switch (data.func) {
				case 'initialize_device':
					postMessage({ type: 'user_message', message: 'Preparing device for testing' });
					
					result = initializeDevice(param);
					
					postMessage({ type: 'user_message', message: 'Device ready for testing', data: result });
					postMessage({ type: 'done' });
					break;
				case 'register_device':
					postMessage({ message: 'Registering device' });
		
					result = registerDevice(param);
					
					postMessage({ type: 'user_message', message: 'Device registered', data: result });
					postMessage({ type: 'done' });
					break;
				case 'check_device_calibration':
					postMessage({ type: 'user_message', message: 'Checking device calibration' });
		
					result = checkCalibration(param);
					
					postMessage({ type: 'user_message', message: 'Device moved to calibration point', data: result });
					postMessage({ type: 'done' });
					break;
			}
		}
	}
	catch(e) {
		postMessage({message:'error'});
	}
}

function initializeDevice(param) {
	var result = {};
	var practice, prescription, status;
	var device = ds.Device(param.deviceID);
	var user = ds.User.find('username === :1', param.username);
		
	if (device === null) {
		result.success = false;
		result.message = 'Device entity not found';
		result.deviceID = param.deviceID;
		throw result;
	}
	
	if (user === null) {
		result.success = false;
		result.message = 'User not found';
		result.username = param.username;
		throw result;
	}
	else {
		practice = user.practice;
	}
	
	if (device.practice.ID !== practice.ID) {
		result.success = false;
		result.message = 'This device is not registered to this practice';
		result.devicePracticeID = device.practice.ID;
		result.userPracticeID = practice.ID;
		throw result;
	}
	
	result = model.Device.methods.check_serial_number({deviceID: device.ID});
	if (!result.success) {
		result.message = 'Serial number does not match';
		result.deviceID = device.ID;
		throw result;
	}
	
	result = spark.initialize_device(device.sparkCoreID);
	if (result && (result.status === 200) && (result.response.return_value !== -1)) {
		result.success = true;
	}
	else {
		result.success = false;
		result.message = 'A problem occurred. Device not ready for testing';
		throw result;
	}
	
	return result;
}

function registerDevice(param) {
	// param: username, deviceID, sparkCoreID, sparkCoreName, sparkCoreLastHeard, serialNumber
	var result = {};
	var practice;
	var device = ds.Device(param.deviceID);
	var user = ds.User.find('username === :1', param.username);
		
	if (device === null) {
		result.success = false;
		result.message = 'Device entity not found';
		result.deviceID = param.deviceID;
		throw result;
	}
	
	if (user === null) {
		result.success = false;
		result.message = 'User not found';
		result.username = param.username;
		throw result;
	}
	else {
		practice = user.practice;
	}
	
	result = spark.write_serial_number(param.sparkCoreID, param.serialNumber);
	if (!result.success) {
		result.message = 'A problem occurred. Device not registered';
		throw result;
	}
	
	device.practice = practice;
	device.sparkCoreID = param.sparkCoreID;
	device.sparkName = param.sparkCoreName;
	device.sparkLastHeard = param.sparkCoreLastHeard;
	device.serialNumber = param.serialNumber;
	device.registeredBy = user;
	device.registeredOn = new Date();
	device.online = true;
	device.save();	
		
	result.deviceID = device.ID;

	return result;
}

function checkCalibration(param) {
	// param: username, deviceID
	var result = {};
	var practice;
	var device = ds.Device(param.deviceID);
	var user = ds.User.find('username === :1', param.username);
		
	if (device === null) {
		result.success = false;
		result.message = 'Device entity not found';
		result.deviceID = param.deviceID;
		throw result;
	}
	
	if (user === null) {
		result.success = false;
		result.message = 'User not found';
		result.username = param.username;
		throw result;
	}
	
	if (device.practice.ID !== user.practice.ID) {
		result.success = false;
		result.message = 'This device is not registered to this practice';
		result.devicePracticeID = device.practice.ID;
		result.userPracticeID = user.practice.ID;
		throw result;
	}

	result = spark.set_and_move_to_calibration_point(device.sparkCoreID, device.calibrationSteps);
	if (!result.success) {
		result.message = 'Problem occurred - device not moved to calibration point';
		throw result;
	}
	
	return result;
}