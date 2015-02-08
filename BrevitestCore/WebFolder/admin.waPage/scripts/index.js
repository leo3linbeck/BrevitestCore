
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonGetAssayResults = {};	// @button
	var buttonRunAssay = {};	// @button
	var buttonInitDevice = {};	// @button
	var buttonGetStatus = {};	// @button
	var buttonReadSerialNumber = {};	// @button
	var buttonWriteSerialNumber = {};	// @button
// @endregion// @endlock

// eventHandlers// @lock

	buttonGetAssayResults.click = function buttonGetAssayResults_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		spark.read_sensor_dataAsync({
			'onSuccess': function(evt) {
				$$('textFieldAssayResults').setValue(evt.data.join('\n'));
			},
			'onError': function(err) {
				
			},
			'params': [coreID]
		});

	};// @lock

	buttonRunAssay.click = function buttonRunAssay_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		spark.run_assayAsync({
			'onSuccess': function(evt) {
				if(evt.success) {
					$$('textFieldRunAssay').setValue('Assay started');
				}
				else {
					$$('textFieldRunAssay').setValue('Assay failed to start');
				}
			},
			'onError': function(err) {
				
			},
			'params': [coreID]
		});

	};// @lock

	buttonInitDevice.click = function buttonInitDevice_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		spark.initialize_deviceAsync({
			'onSuccess': function(evt) {
				if(evt.success) {
					$$('textFieldInitializeDevice').setValue('Device initialized');
				}
				else {
					$$('textFieldInitializeDevice').setValue('Device failed to initialize');
				}
			},
			'onError': function(err) {
				
			},
			'params': [coreID]
		});
	};// @lock

	buttonGetStatus.click = function buttonGetStatus_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		spark.get_statusAsync({
			'onSuccess': function(evt) {
				$$('textFieldDeviceStatus').setValue(evt.value);
			},
			'onError': function(err) {
				
			},
			'params': [coreID]
		});

	};// @lock

	buttonReadSerialNumber.click = function buttonReadSerialNumber_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		spark.read_serial_numberAsync({
			'onSuccess': function(evt) {
				$$('textFieldReadSerialNumber').setValue(evt.value);
			},
			'onError': function(err) {
				
			},
			'params': [coreID]
		});

	};// @lock

	buttonWriteSerialNumber.click = function buttonWriteSerialNumber_click (event)// @startlock
	{// @endlock
		var coreID = $$('textFieldSparkCoreID').getValue();
		var sn = $$('textFieldWriteSerialNumber').getValue();
		if (sn.length === 19) {
			spark.write_serial_numberAsync({
				'onSuccess': function(evt) {
					
				},
				'onError': function(err) {
					
				},
				'params': [coreID, sn]
			});
		}
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("buttonGetAssayResults", "click", buttonGetAssayResults.click, "WAF");
	WAF.addListener("buttonRunAssay", "click", buttonRunAssay.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
	WAF.addListener("buttonGetStatus", "click", buttonGetStatus.click, "WAF");
	WAF.addListener("buttonReadSerialNumber", "click", buttonReadSerialNumber.click, "WAF");
	WAF.addListener("buttonWriteSerialNumber", "click", buttonWriteSerialNumber.click, "WAF");
// @endregion
};// @endlock
