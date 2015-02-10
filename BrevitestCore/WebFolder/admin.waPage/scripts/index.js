
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonSensorData = {};	// @button
	var buttonGetAssayResults = {};	// @button
	var buttonRunAssay = {};	// @button
	var buttonInitDevice = {};	// @button
	var buttonGetStatus = {};	// @button
	var buttonReadSerialNumber = {};	// @button
	var buttonWriteSerialNumber = {};	// @button
// @endregion// @endlock

	var notification = humane.create({ timeout: 2000, baseCls: 'humane-original' });
	notification.error = humane.spawn({ addnCls: 'humane-original-error', clickToClose: true, timeout: 0 });

	function callSpark(funcName, params, callback) {
		params.splice(0, 0, $$('textFieldSparkCoreID').getValue());
		spark[funcName + 'Async']({
			'onSuccess': function(event) {
				if (event.success) {
					callback(event);
				}
				else {
					notification.error('Command failed to complete');
				}
			},
			'onError': function(error) {
				notification.error('System error in ' + funcName);
			},
			'params': params
		});
	}
	
// eventHandlers// @lock

	buttonSensorData.click = function buttonSensorData_click (event)// @startlock
	{// @endlock
		callSpark('collect_sensor_data', [], function(evt) {
				notification.log('Sensor data collected');
				$$('textFieldSensorData').setValue('Collection complete');
			}
		);
	};// @lock

	buttonGetAssayResults.click = function buttonGetAssayResults_click (event)// @startlock
	{// @endlock
		var a = [];
		if (!$$('checkboxAllResults').getValue()) {
			a.push(assayCode);
		}
		callSpark('read_sensor_data', a, function(evt) {
				notification.log('Assay results retrieved');
				$$('textFieldAssayResults').setValue(evt.data.join('\n'));
			}
		);
	};// @lock

	buttonRunAssay.click = function buttonRunAssay_click (event)// @startlock
	{// @endlock
		callSpark('run_assay', [], function(evt) {
				notification.log('Assay successfully started');
				$$('textFieldRunAssay').setValue('Assay started');
			}
		);
	};// @lock

	buttonInitDevice.click = function buttonInitDevice_click (event)// @startlock
	{// @endlock
		callSpark('initialize_device', [], function(evt) {
				notification.log('Device initialization successful');
				$$('textFieldInitializeDevice').setValue('Device initialized');
			}
		);
	};// @lock

	buttonGetStatus.click = function buttonGetStatus_click (event)// @startlock
	{// @endlock
		callSpark('get_status', [], function(evt) {
				deviceStatus = evt.value;
				sources.deviceStatus.sync();
			}
		);
	};// @lock

	buttonReadSerialNumber.click = function buttonReadSerialNumber_click (event)// @startlock
	{// @endlock
		callSpark('read_serial_number', [], function(evt) {
				notification.log('Serial number retrieved');
				$$('textFieldReadSerialNumber').setValue(evt.value);
			}
		);
	};// @lock

	buttonWriteSerialNumber.click = function buttonWriteSerialNumber_click (event)// @startlock
	{// @endlock
		if (serialNumber.length === 19) {
			callSpark('write_serial_number', [serialNumber], function(evt) {
					notification.log('Serial number written');
				}
			);
		}
		else {
			notification.error('Serial number must be exactly 19 characters long');
		}
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("buttonSensorData", "click", buttonSensorData.click, "WAF");
	WAF.addListener("buttonGetAssayResults", "click", buttonGetAssayResults.click, "WAF");
	WAF.addListener("buttonRunAssay", "click", buttonRunAssay.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
	WAF.addListener("buttonGetStatus", "click", buttonGetStatus.click, "WAF");
	WAF.addListener("buttonReadSerialNumber", "click", buttonReadSerialNumber.click, "WAF");
	WAF.addListener("buttonWriteSerialNumber", "click", buttonWriteSerialNumber.click, "WAF");
// @endregion
};// @endlock
