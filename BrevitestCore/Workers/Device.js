var spark = require('sparkCore');
var shouldTerminate;

function sendToParent(deviceID, type, obj) {
	obj.deviceID = deviceID;
	obj.type = type;
	postMessage(obj);
}

onmessage = function(e) {
	var result = {};
	var data = e.data.data;
	var func = data.func;
	var message = data.message;
	var param = data.param;
	var dataSources = data.dataSources;
	var deviceID = data.deviceID;
	var device = ds.Device(deviceID);
	
	shouldTerminate = e.data.shouldTerminate ? true : false;
	
	console.log('Device worker, processing message', e.data.command, data);
	try {
		if (e.data.command === 'start') {
			switch (func) {
				case 'load_parameters':
					sendToParent(deviceID, 'user_message', { message: 'Loading parameters' });
					result = spark.request_all_parameters(device.sparkCoreID);
					sendToParent(deviceID, 'user_data', { name: 'device_parameters', data: result.data });					
					sendToParent(deviceID, 'done', { func: func });
					break;
				case 'change_parameter':
					sendToParent(deviceID, 'user_message', { message: 'Changing parameter value' });
					result = spark.change_parameter(device.sparkCoreID, param.name, param.value);
					sendToParent(deviceID, 'user_data', { name: 'new_parameter', data: result.response.return_value });					
					sendToParent(deviceID, 'done', { func: func });
					break;
				case 'reset_parameters':
					sendToParent(deviceID, 'user_message', { message: 'Resetting parameters to default' });
					result = spark.reset_parameters(device.sparkCoreID);
					sendToParent(deviceID, 'user_data', { name: 'device_parameters', data: result.data });					
					sendToParent(deviceID, 'done', { func: func });
					break;
				case 'initialize_device':
					sendToParent(deviceID, 'user_message', { message: 'Initializing device' });
					result = initializeDevice(param);
					sendToParent(deviceID, 'done', { func: func, data: result });
					break;
				case 'register_device':
					sendToParent(deviceID, 'Registering device', {} );
					result = registerDevice(param);
					sendToParent(deviceID, 'done', { func: func, data: result });
					break;
				case 'check_device_calibration':
					sendToParent(deviceID, 'user_message', { message: 'Checking device calibration' });
					result = checkCalibration(param);
					sendToParent(deviceID, 'done', { func: func, data: result });
					break;
				case 'run_test':
					result = runTest(param);
					sendToParent(deviceID, 'done', { func: func, data: result });
					break;
				case 'reload_cartridges':
					sendToParent(deviceID, 'reload_cartridges', {} );
					break;
				case 'get_sensor_data':
					sendToParent(deviceID, 'user_message', { message: 'Reading sensor data' });
					result = getSensorData(param);
					sendToParent(deviceID, 'done', { func: func, dataSources: dataSources, data: result });
					break;
			}
		}
		else if (e.data.command === 'cancel') {
			sendToParent(deviceID, 'cancelling', { message: 'Cancelling test' });

			result = cancelProcess(param);
			
			sendToParent(deviceID, 'user_message', { message: 'Cancelled', data: result });
			sendToParent(deviceID, 'done', { func: func } );
		}
	}
	catch(e) {
		sendToParent(deviceID, 'error', { message: e } );
	}
}

function getSensorData(param) {
	var device, result;
	
	console.log('Getting sensor data');
	result = spark.get_core_list();
	if (result.success) {
		device = ds.Device.query('sparkCoreID !== null');
		device.forEach(function(d) {
			d.update_status(result.response);
		});		
	}
	else {
		throw result;
	}
	
	return result;
}

function runTest(param) {
	// param: username, deviceID, cartridgeID
	sendToParent(param.deviceID, 'user_message', { message: 'Checking test parameters' });
	var test;
	var result = {};
	var cartridge = ds.Cartridge(param.cartridgeID);
	var device = ds.Device(param.deviceID);
	var user = ds.User.find('username === :1', param.username);
	var startTime;
	
	if (cartridge === null) {
		result.success = false;
		result.message = 'Cartridge entity not found';
		result.cartridgeID = param.cartridgeID;
		result.type = 'error';
		return result;
	}
	
	if (device === null) {
		result.success = false;
		result.message = 'Device entity not found';
		result.deviceID = param.deviceID;
		result.type = 'error';
		return result;
	}
	
	if (user === null) {
		result.success = false;
		result.message = 'User not found';
		result.username = param.username;
		result.type = 'error';
		return result;
	}
	else {
		practice = user.practice;
	}
	
	if (device.practice.ID !== practice.ID || cartridge.practice.ID !== practice.ID) {
		result.success = false;
		result.message = 'Practice is not the same for user, device, and cartridge';
		result.cartridgePracticeID = cartridge.practice.ID;
		result.devicePracticeID = device.practice.ID;
		result.userPracticeID = practice.ID;
		result.type = 'error';
		return result;
	}
	
	if (shouldTerminate) {
		return result;
	}
	result = model.Device.methods.check_serial_number({deviceID: device.ID});
	if (!result.success) {
		result.message = 'Device serial number does not match';
		result.deviceID = device.ID;
		result.type = 'error';
		return result;
	}
	
	sendToParent(param.deviceID, 'user_message', { message: 'Checking whether device is ready' });
	if (shouldTerminate) {
		return result;
	}
	result = spark.ready_to_run_test(device.sparkCoreID);
	if ((result.status !== 200) || (result.response.return_value === -1)) {
		result.message = 'Device not ready';
		result.deviceID = device.ID;
		result.type = 'error';
		return result;
	}
	
	sendToParent(param.deviceID, 'user_message', { message: 'Loading instructions into device - this will take about 15 seconds' });
	if (shouldTerminate) {
		return result;
	}
	result = spark.send_BCODE_to_spark(device.sparkCoreID, cartridge.ID, cartridge.assay.BCODE);
	if (!result.success) {
		result.message = 'Error loading instructions into device';
		result.BCODE = cartridge.assay.BCODE;
		result.type = 'error';
		return result;
	}
		
	if (shouldTerminate) {
		return result;
	}
	result = spark.run_test(device.sparkCoreID, cartridge.ID, cartridge.assay.BCODE);
	if (result.success) {
		test = ds.Test.createEntity();
		test.assay = cartridge.assay;
		test.device = device;
		test.startedOn = new Date();
		test.status = 'In progress';
		test.percentComplete = 0;
		test.save();
		
		cartridge.test = test;
		cartridge.startedOn = test.startedOn;
		cartridge.startedBy = user;
		cartridge.save();
		
		startTime = new Date();
		sendToParent(param.deviceID, 'reload_cartridges', {} );
		updateTestStatus(param.deviceID, test, cartridge);
		(function doIt() {
			var now = new Date();
			setTimeout(function() {
				if (shouldTerminate) {
					return;
				}
				else {
					updateTestStatus(param.deviceID, test, cartridge);
				}
				if ((now - startTime) < 900000) {
					doIt();
				}
				else {
					console.log('Update test status timeout');
				}
			}, 10000);
		})();
	}
	else {
		result.message('Test failed to start');
		result.type = 'error';
		return result;
	}
	
	return result;
}

function updateTestStatus(deviceID, test, cartridge) {
	if (shouldTerminate) {
		return;
	}
	result = spark.get_test_percent_complete(test.device.sparkCoreID);
	if (result.success) {
		test.percentComplete = result.value;
		test.save();
		sendToParent(deviceID, 'percent_complete', { data: { testID: test.ID, cartridgeID: cartridge.ID, startedOn: cartridge.startedOn, percent_complete: result.value } });
		if (test.percentComplete === 100) {
			cartridge.get_data_from_device();
			sendToParent(deviceID, 'user_message', { message: 'Test finished' });
			sendToParent(deviceID, 'refresh', { datastores: ['Test', 'Cartridge'] });
			shouldTerminate = true;
		}
	}
}

function cancelProcess(param) {
	// param: cartridgeID or testID
	var cartridge, ref, result = {}, updateManager, thePort;
	
	if (param.cartridgeID) {
		cartridge = ds.Cartridge(param.cartridgeID);
	}
	else {
		if (param.testID) {
			cartridge = ds.Cartridge.find('finishedOn === null AND failed === false AND test.ID === :1', param.testID);
		}
		else {
			result.success = false;
			result.message = 'Test not cancelled  - parameter not found';
			result.type = 'error';
			return result;
		}
	}
	
	if (!cartridge) {
		result.success = false;
		result.message = 'Test not cancelled - cartridge not found';
		result.type = 'error';
		return result;
	}
	
	result = spark.cancel_process(cartridge.test.device.sparkCoreID);
	if (result.success) {
		shouldTerminate = true;
		cartridge.test.status = 'Cancelled';
		cartridge.test.save();
		result.message = 'Test cancelled';
	}
	else {
		result.success = false;
		result.message = 'Test not cancelled - unable to stop device at this time';
		result.type = 'error';
	}
	
	return result;
}

function initializeDevice(param) {
	// param: username, deviceID
	if (shouldTerminate) {
		return;
	}
	var startTime;
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
	
	if (shouldTerminate) {
		return;
	}
	result = model.Device.methods.check_serial_number({deviceID: device.ID});
	if (!result.success) {
		result.message = 'Serial number does not match';
		result.deviceID = device.ID;
		throw result;
	}
	
	if (shouldTerminate) {
		return;
	}
	startTime = new Date();
	result = spark.initialize_device(device.sparkCoreID);
	(function doIt() {
		var now = new Date();
		setTimeout(function() {
			if (shouldTerminate) {
				return;
			}
			else {
				if (deviceInitialized(device.sparkCoreID)) {
					exitWait();
					return;
				}
			}
			if ((now - startTime) < 20000) {
				doIt();
			}
			else {
				console.log('Initialization timeout');
			}
		}, 1000);
	})();
	wait();
	
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

function deviceInitialized(coreID) {
	var result = spark.get_status(coreID);
	return (result && result.success && result.value === 'Device initialized and ready to run test');
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
	
	if (shouldTerminate) {
		return;
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
	sendToParent(param.deviceID, 'user_message', { message: 'Moving to calibration point' });
	var startTime;
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

	if (shouldTerminate) {
		return;
	}

	startTime = new Date();
	result = spark.set_and_move_to_calibration_point(device.sparkCoreID, device.calibrationSteps);
	(function doIt() {
		var now = new Date();
		setTimeout(function() {
			if (shouldTerminate) {
				return;
			}
			else {
				if (deviceCalibrated(device.sparkCoreID)) {
					exitWait();
					return;
				}
			}
			if ((now - startTime) < 20000) {
				doIt();
			}
			else {
				console.log('Initialization timeout');
			}
		}, 1000);
	})();
	wait();

	if (!result.success) {
		result.message = 'Problem occurred - device not moved to calibration point';
		throw result;
	}
	
	return result;
}

function deviceCalibrated(coreID) {
	var result = spark.get_status(coreID);
	return (result && result.success && result.value === 'Device at calibration point');
}

