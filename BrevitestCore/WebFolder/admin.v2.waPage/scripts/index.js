
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonDeleteAssay = {};	// @button
	var buttonSaveAssay = {};	// @button
	var buttonCancelAssay = {};	// @button
	var buttonCreateAssay = {};	// @button
	var sparkCoresEvent = {};	// @dataSource
	var menuItemDevice = {};	// @menuItem
	var buttonChangeParameter = {};	// @button
	var buttonLoadParams = {};	// @button
	var buttonResetParams = {};	// @button
	var buttonRefreshCores = {};	// @button
	var buttonGetAssayResults = {};	// @button
	var checkboxMonitorStatus = {};	// @checkbox
	var buttonGetStatus = {};	// @button
	var buttonCancelProcess = {};	// @button
	var buttonSensorData = {};	// @button
	var buttonSetSerialNumber = {};	// @button
	var buttonRegisterDevice = {};	// @button
// @endregion// @endlock

	var allCaps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var spinnerOpts = {
		color: '#CCC'
	};
	var spinner = new Spinner(spinnerOpts);
	
	var notification = humane.create({ timeout: 2000, baseCls: 'humane-libnotify' });
	notification.error = humane.spawn({ addnCls: 'humane-libnotify-error', clickToClose: true, timeout: 0 });
	
	var statusMonitorID = null;
	var firmwareVersion = 8;
	var sparkCoreList = [];

	function callSpark(that, funcName, params, callback, errorCallback) {
		spinner.spin(that.domNode);
		spark[funcName + 'Async']({
			'onSuccess': function(event) {
				spinner.stop();
				if (event.success) {
					if (callback) {
						callback(event);
					}
				}
				else {
					notification.error('Command failed to complete' + (event.message ? ' - ' + event.message : ''));
				}
			},
			'onError': function(error) {
				spinner.stop();
				if (errorCallback) {
					errorCallback(error);
				}
				else {
					notification.error('System error in ' + funcName);
				}
			},
			'params': params
		});
	}
	
	function startStatusMonitoring(that) {
		if (statusMonitorID) {
			clearInterval(statusMonitorID);
		}
			
		callSpark(that, 'get_status', [sources.sparkCores.id], function(event) {
				deviceStatus = event.value;
				sources.deviceStatus.sync();
			},
			function(error) {
				return; // ignore error when continuously monitoriing
			}
		);
		
		statusMonitorID = setInterval(function(this_one) {
			callSpark(this_one, 'get_status', [sources.sparkCores.id], function(event) {
					deviceStatus = event.value;
					sources.deviceStatus.sync();
				},
				function(error) {
					return; // ignore error when continuously monitoriing
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
	
	function clearSparkParameters() {
		sparkAttr.length = 0;
		sources.sparkAttr.sync();
	}
	
	function changeSparkCore(dataSource) {
		if (dataSource.connected) {
			callSpark(this, 'get_firmware_version', [sources.sparkCores.id], function(evt) {
					if (firmwareVersion === evt.response.return_value) {
						$$('containerCommand').show();
						$$('containerAssayResults').show();
						$$('containerAttributes').show();
						$$('richTextSplash').hide();
						$$('richTextVersionWarning').hide();
						callSpark(this, 'get_archive_size', [sources.sparkCores.id], function(evt) {
								archiveSize = evt.response.return_value;
								sources.archiveSize.sync();
								if (archiveSize > 0) {
									assayNumber = archiveSize;
									sources.assayNumber.sync();
								}
							}
						);
					}
					else {
						$$('containerCommand').hide();
						$$('containerAssayResults').hide();
						$$('containerAttributes').hide();
						$$('richTextSplash').show();
						$$('richTextVersionWarning').show();
					}
				}
			);
		}
		else {
			$$('containerCommand').hide();
			$$('containerAssayResults').hide();
			$$('containerAttributes').hide();
			$$('richTextSplash').show();
			$$('richTextVersionWarning').hide();
		}
	}
	
// eventHandlers// @lock

	buttonDeleteAssay.click = function buttonDeleteAssay_click (event)// @startlock
	{// @endlock
		sources.assay.removeCurrent(
			{
				onSuccess: function(evt) {
						notification.log('Assay deleted');
					},
				onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					}
			}
		);
	};// @lock

	buttonSaveAssay.click = function buttonSaveAssay_click (event)// @startlock
	{// @endlock
		sources.assay.save(
			{
				onSuccess: function(evt) {
						notification.log('Assay saved');
					},
				onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					}
			}
		);
	};// @lock

	buttonCancelAssay.click = function buttonCancelAssay_click (event)// @startlock
	{// @endlock
		sources.assay.serverRefresh(
			{
				onSuccess: function(evt) {
						
						notification.log('Assay changes discarded');
					},
				onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					},
				forceReload: true
			}
		);
	};// @lock

	buttonCreateAssay.click = function buttonCreateAssay_click (event)// @startlock
	{// @endlock
		sources.assay.addNewElement(
			{
				onSuccess: function(evt) {
						notification.log('Assay added');
						sources.assay.serverRefresh({onSuccess: function(ev) {return;}});
					},
				onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					}
			}
		);
	};// @lock

	sparkCoresEvent.onCurrentElementChange = function sparkCoresEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		changeSparkCore(event.dataSource);
	};// @lock

	menuItemDevice.click = function menuItemDevice_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_list_of_cores', [], function(evt) {
				sparkCores = evt.response;
				sources.sparkCores.sync();
			}
		);
	};// @lock

	buttonChangeParameter.click = function buttonChangeParameter_click (event)// @startlock
	{// @endlock
		callSpark(this, 'change_parameter', [sources.sparkCores.id, sources.sparkAttr.name, sources.sparkAttr.value], function(evt) {
				if (sources.sparkAttr.value === evt.response.return_value) {
					notification.log('Parameter successfully changed');
				}
				else {
					notification.error('Parameter change failed. Reset to previous value.');
					sources.sparkAttr.value = evt.response.return_value;
					sources.sparkAttr.sync();
				}
			}
		);
	};// @lock

	buttonLoadParams.click = function buttonLoadParams_click (event)// @startlock
	{// @endlock
		callSpark(this, 'request_all_parameters', [sources.sparkCores.id], function(evt) {
				notification.log('Parameters loaded');
				sparkAttr = evt.data;
				sources.sparkAttr.sync();
			}
		);
	};// @lock

	buttonResetParams.click = function buttonResetParams_click (event)// @startlock
	{// @endlock
		callSpark(this, 'reset_parameters', [sources.sparkCores.id], function(evt) {
				notification.log('Parameters reset to default values');
				sparkAttr = evt.data;
				sources.sparkAttr.sync();
			}
		);
	};// @lock

	buttonRefreshCores.click = function buttonRefreshCores_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_list_of_cores', [], function(evt) {
				notification.log('Core list refreshed');
				sparkCores = evt.response;
				sources.sparkCores.sync();
				clearSparkParameters();
			}
		);
	};// @lock

	buttonGetAssayResults.click = function buttonGetAssayResults_click (event)// @startlock
	{// @endlock
		if (assayNumber > 0 && assayNumber <= archiveSize) {
			callSpark(this, 'request_archive_data', [sources.sparkCores.id, assayNumber - 1], function(evt) {
					notification.log('Archived assay results retrieved');
					$$('textFieldAssayResults').setValue(evt.data.join('\n'));
				}
			);
		}
		else {
			notification.error('Assay record number out of range');
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

	buttonGetStatus.click = function buttonGetStatus_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_status', [sources.sparkCores.id], function(evt) {
				deviceStatus = evt.value;
				sources.deviceStatus.sync();
			}
		);
	};// @lock

	buttonCancelProcess.click = function buttonCancelProcess_click (event)// @startlock
	{// @endlock
		callSpark(this, 'cancel_process', [sources.sparkCores.id], function(evt) {
				notification.log('Process cancelled');
			}
		);
	};// @lock

	buttonSensorData.click = function buttonSensorData_click (event)// @startlock
	{// @endlock
		callSpark(this, 'collect_sensor_data', [sources.sparkCores.id], function(evt) {
				notification.log('Sensor data collection started');
			}
		);
	};// @lock

	buttonSetSerialNumber.click = function buttonSetSerialNumber_click (event)// @startlock
	{// @endlock
		var serial_number = Window.prompt('Enter serial number:', 'XXXX-XXXX-XXXX-XXXX');
		var r = validateSerialNumber(serial_number);
		if (r.valid) {
			callSpark(this, 'set_serial_number', [sources.sparkCores.id, serial_number], function(evt) {
					if (evt.response.return_value !== -1) {
						notification.log('Serial number changed');
					}
					else {
						notification.error('ERROR: Serial number not changed');
					}
				}
			);
		}
		else {
			notification.error(r.errorMsg);	
		}
	};// @lock

	buttonRegisterDevice.click = function buttonRegisterDevice_click (event)// @startlock
	{// @endlock
		callSpark(this, 'initialize_device', [sources.sparkCores.id], function(evt) {
				notification.log('Device initialization started');
			}
		);
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("buttonDeleteAssay", "click", buttonDeleteAssay.click, "WAF");
	WAF.addListener("buttonSaveAssay", "click", buttonSaveAssay.click, "WAF");
	WAF.addListener("buttonCancelAssay", "click", buttonCancelAssay.click, "WAF");
	WAF.addListener("buttonCreateAssay", "click", buttonCreateAssay.click, "WAF");
	WAF.addListener("sparkCores", "onCurrentElementChange", sparkCoresEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemDevice", "click", menuItemDevice.click, "WAF");
	WAF.addListener("buttonChangeParameter", "click", buttonChangeParameter.click, "WAF");
	WAF.addListener("buttonLoadParams", "click", buttonLoadParams.click, "WAF");
	WAF.addListener("buttonResetParams", "click", buttonResetParams.click, "WAF");
	WAF.addListener("buttonRefreshCores", "click", buttonRefreshCores.click, "WAF");
	WAF.addListener("buttonGetAssayResults", "click", buttonGetAssayResults.click, "WAF");
	WAF.addListener("checkboxMonitorStatus", "change", checkboxMonitorStatus.change, "WAF");
	WAF.addListener("buttonGetStatus", "click", buttonGetStatus.click, "WAF");
	WAF.addListener("buttonCancelProcess", "click", buttonCancelProcess.click, "WAF");
	WAF.addListener("buttonSensorData", "click", buttonSensorData.click, "WAF");
	WAF.addListener("buttonSetSerialNumber", "click", buttonSetSerialNumber.click, "WAF");
	WAF.addListener("buttonRegisterDevice", "click", buttonRegisterDevice.click, "WAF");
// @endregion
};// @endlock
