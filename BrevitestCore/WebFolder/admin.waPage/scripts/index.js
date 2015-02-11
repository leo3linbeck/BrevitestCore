
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var documentEvent = {};	// @document
	var checkboxAllResults = {};	// @checkbox
	var checkboxMonitorStatus = {};	// @checkbox
	var buttonSensorData = {};	// @button
	var buttonGetAssayResults = {};	// @button
	var buttonRunAssay = {};	// @button
	var buttonInitDevice = {};	// @button
	var buttonGetStatus = {};	// @button
	var buttonReadSerialNumber = {};	// @button
	var buttonWriteSerialNumber = {};	// @button
// @endregion// @endlock

	var allCaps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var spinnerOpts = {
		color: '#CCC'
	};
	var spinner = new Spinner(spinnerOpts);
	
	var notification = humane.create({ timeout: 2000, baseCls: 'humane-original' });
	notification.error = humane.spawn({ addnCls: 'humane-original-error', clickToClose: true, timeout: 0 });
	
	var statusMonitorID = null;

	function callSpark(that, funcName, params, callback) {
		params.splice(0, 0, coreID);
		spinner.spin(that.domNode);
		spark[funcName + 'Async']({
			'onSuccess': function(event) {
				spinner.stop();
				if (event.success) {
					callback(event);
				}
				else {
					notification.error('Command failed to complete');
				}
			},
			'onError': function(error) {
				spinner.stop();
				notification.error('System error in ' + funcName);
			},
			'params': params
		});
	}
	
	function startStatusMonitoring(that) {
		if (statusMonitorID) {
			clearInterval(statusMonitorID);
		}
			
		callSpark(that, 'get_status', [], function(event) {
				deviceStatus = event.value;
				sources.deviceStatus.sync();
			}
		);
		
		statusMonitorID = setInterval(function(this_one) {
			callSpark(this_one, 'get_status', [], function(event) {
					deviceStatus = event.value;
					sources.deviceStatus.sync();
				}
			);
		}, 5000, that);
	}
	
	function stopStatusMonitoring() {
		clearInterval(statusMonitorID);
		statusMonitorID = null;
	}
	
	function validateSerialNumber() {
		var r = { valid: true };
		
		if (serialNumber.length !== 19) {
			r.valid = false;
			r.errorMsg = 'Serial number must be exactly 19 characters';
			return r;
		}
		
		for (i = 0; i < 19; i += 1) {
			if (i === 4 || i === 9 || i === 14) {
				if (serialNumber[i] !== '-') {
					r.valid = false;
					r.errorMsg = 'Serial number must be of the form XXXX-XXXX-XXXX-XXXX';
				}
			}
			else {
				if (allCaps.indexOf(serialNumber[i]) === -1) {
					r.valid = false;
					r.errorMsg = 'Serial number must use all capitalized letters';
				}
			}
		}
		
		return r;
	}
	
// eventHandlers// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		coreID = '53ff6e066667574844262367';
		sources.coreID.sync();
	};// @lock

	checkboxAllResults.change = function checkboxAllResults_change (event)// @startlock
	{// @endlock
		if (this.getValue()) {
			$$('textFieldAssayCode').hide();
		}
		else {
			$$('textFieldAssayCode').show();			
		}
	};// @lock

	checkboxMonitorStatus.change = function checkboxMonitorStatus_change (event)// @startlock
	{// @endlock
		if(this.getValue()) { // turn on continuous status monitoring
			$$('buttonGetStatus').disable();
			startStatusMonitoring($$('buttonGetStatus'));
		}
		else { // turn off continuous status monitoring
			stopStatusMonitoring();
			$$('buttonGetStatus').enable();
		}
	};// @lock

	buttonSensorData.click = function buttonSensorData_click (event)// @startlock
	{// @endlock
		callSpark(this, 'collect_sensor_data', [], function(evt) {
				notification.log('Sensor data collected');
				$$('textFieldResult').setValue('Collection complete');
			}
		);
	};// @lock

	buttonGetAssayResults.click = function buttonGetAssayResults_click (event)// @startlock
	{// @endlock
		if ($$('checkboxAllResults').getValue()) {
			callSpark(this, 'request_all_sensor_data', [], function(evt) {
					notification.log('Assay results retrieved');
					$$('textFieldAssayResults').setValue(evt.data.join('\n'));
				}
			);
		}
		else {
			callSpark(this, 'request_sensor_data', [assayCode], function(evt) {
					notification.log('Assay results retrieved');
					$$('textFieldAssayResults').setValue(evt.data.join('\n'));
				}
			);
		}
	};// @lock

	buttonRunAssay.click = function buttonRunAssay_click (event)// @startlock
	{// @endlock
		callSpark(this, 'run_assay', [], function(evt) {
				notification.log('Assay successfully started');
				$$('textFieldResult').setValue('Assay started');
			}
		);
	};// @lock

	buttonInitDevice.click = function buttonInitDevice_click (event)// @startlock
	{// @endlock
		callSpark(this, 'initialize_device', [], function(evt) {
				notification.log('Device initialization successful');
				$$('textFieldResult').setValue('Device initialized');
			}
		);
	};// @lock

	buttonGetStatus.click = function buttonGetStatus_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_status', [], function(evt) {
				deviceStatus = evt.value;
				sources.deviceStatus.sync();
			}
		);
	};// @lock

	buttonReadSerialNumber.click = function buttonReadSerialNumber_click (event)// @startlock
	{// @endlock
		callSpark(this, 'request_serial_number', [], function(evt) {
				notification.log('Serial number retrieved');
				$$('textFieldReadSerialNumber').setValue(evt.value);
			}
		);
	};// @lock

	buttonWriteSerialNumber.click = function buttonWriteSerialNumber_click (event)// @startlock
	{// @endlock
		var v = validateSerialNumber();
		if (v.valid) {
			callSpark(this, 'write_serial_number', [serialNumber], function(evt) {
					notification.log('Serial number written');
				}
			);
		}
		else {
			notification.error(v.errorMsg);
		}
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("checkboxAllResults", "change", checkboxAllResults.change, "WAF");
	WAF.addListener("checkboxMonitorStatus", "change", checkboxMonitorStatus.change, "WAF");
	WAF.addListener("buttonSensorData", "click", buttonSensorData.click, "WAF");
	WAF.addListener("buttonGetAssayResults", "click", buttonGetAssayResults.click, "WAF");
	WAF.addListener("buttonRunAssay", "click", buttonRunAssay.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
	WAF.addListener("buttonGetStatus", "click", buttonGetStatus.click, "WAF");
	WAF.addListener("buttonReadSerialNumber", "click", buttonReadSerialNumber.click, "WAF");
	WAF.addListener("buttonWriteSerialNumber", "click", buttonWriteSerialNumber.click, "WAF");
// @endregion
};// @endlock
