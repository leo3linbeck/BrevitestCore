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
				case 'run_test':
					postMessage({ message: 'Starting test' });
					
					result = runTest(param);
										
					postMessage({ message: 'Test finished', data: result });
					postMessage({ message: 'done' });
					break;
				case 'cancel_test':
					postMessage({ message: 'Cancelling test' });
		
					result = cancelTest(param);
					
					postMessage({ message: 'Test cancelled', data: result });
					postMessage({ message: 'done' });
					break;
			}
		}
		else if (data.message === 'should_terminate') {
			shouldTerminate = true;
		}
	}
	catch(e) {
		postMessage({message:'error', data: e});
	}
}

function runTest(param) {
	// param: username, deviceID, cartridgeID
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
		throw result;
	}
	
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
	
	if (device.practice.ID !== practice.ID || cartridge.practice.ID !== practice.ID) {
		result.success = false;
		result.message = 'Practice is not the same for user, device, and cartridge';
		result.cartridgePracticeID = cartridge.practice.ID;
		result.devicePracticeID = device.practice.ID;
		result.userPracticeID = practice.ID;
		throw result;
	}
	
	postMessage({ message: 'Checking device serial number' });
	result = model.Device.methods.check_serial_number({deviceID: device.ID});
	if (!result.success) {
		postMessage({ message: 'Device serial number does not match' });
		result.deviceID = device.ID;
		throw result;
	}
	
	postMessage({ message: 'Checking whether device is ready' });
	result = spark.ready_to_run_assay(device.sparkCoreID);
	if ((result.status !== 200) || (result.response.return_value === -1)) {
		postMessage({ message: 'Device not ready' });
		result.deviceID = device.ID;
		throw result;
	}
	
	postMessage({ message: 'Loading instructions into device' });
	result = spark.send_BCODE_to_spark(device.sparkCoreID, cartridge.ID, cartridge.assay.BCODE);
	if (!result.success) {
		postMessage({ message: 'Error loading instructions into device' });
		result.BCODE = cartridge.assay.BCODE;
		throw result;
	}
		
	postMessage({ message: 'Starting test' });
	result = spark.run_test(device.sparkCoreID, cartridge.ID, cartridge.assay.BCODE);
	if (result.success) {
		postMessage('Test started');
		test = ds.Test.createEntity();
		test.assay = cartridge.assay;
		test.device = device;
		test.startedOn = new Date();
		test.status = 'In progress';
		test.percentComplete = 0;
		test.save();
		
		cartridge.test = test;
		cartridge.startedOn = test.startedOn;
		cartridge.save();
		
		startTime = new Date();
		updateTestStatus(test);
		(function doIt() {
			var now = new Date();
			setTimeout(function() {
				if (shouldTerminate) {
					return;
				}
				else {
					updateTestStatus(test);
				}
				if ((now - startTime) < 120000) {
					doIt();
				}
				else {
					console.log(func + ' timeout');
				}
			}, 10000);
		})();
	}
	else {
		throw('Test failed to start');
	}
	
	return result;
}

function updateTestStatus(test) {
	result = spark.get_test_percent_complete(test.device.sparkCoreID);
	if (result.success) {
		test.percentComplete = result.value;
		test.save();
	}
}

function cancelTest(param) {
	// param: cartridgeID or testID
	var cartridge, ref, result = {}, updateManager, thePort;
	
	if (!param.cartridgeID) {
		cartridge = ds.Cartridge(param.cartridgeID);
	}
	else {
		if (param.testID) {
			cartridge = ds.Cartridge.find('finishedOn === null AND failed === false AND test.ID === :1', param.testID);
		}
		else {
			result.success = false;
			result.message = 'Test not cancelled  - parameter not found';
			throw result;
		}
	}
	
	if (!cartridge) {
		result.success = false;
		result.message = 'Test not cancelled - cartridge not found';
		throw result;
	}
	
	result = spark.cancel_process(cartridge.test.device.sparkCoreID);
	if (result.success) {
		shouldTerminate = true;
		cartridge.test.status = 'Cancelled';
		cartridge.test.save();
	}
	else {
		result.success = false;
		result.message = 'Test not cancelled - unable to stop device at this time';
		throw result;
	}
	
	return result;
}
