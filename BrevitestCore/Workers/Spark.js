
var spark = require('sparkCore');
var shouldTerminate;

function refreshDevices() {
	var device, result;
	
	console.log('Retrieving spark core list');
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

function getSensorData() {
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

onmessage = function(e) {
	var result = {};
	var data = e.data;
	var message = data.message;
	var dataSources = data.dataSources;
	var device = ds.Device(data.deviceID);
	
	shouldTerminate = e.data.shouldTerminate ? true : false;
	try {
		if (data.message === 'start') {
			switch (data.func) {
				case 'refresh_devices':
					result = refreshDevices();
					postMessage({ type: 'done', dataSources: dataSources, data: result });
					break;
				case 'get_sensor_data':
					if (device) {
						result = getSensorData(device.sparkCoreID);
					}
					postMessage({ type: 'done', dataSources: dataSources, data: result });
					break;
			}
		}
	}
	catch(e) {
		postMessage({message:'error', data: e });
	}
}
