﻿
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var menuItemResults = {};	// @menuItem
	var deviceResultsEvent = {};	// @dataSource
	var assayTestEvent = {};	// @dataSource
	var checkboxTestStatus = {};	// @checkbox
	var buttonTestStatus = {};	// @button
	var buttonCancelTest = {};	// @button
	var buttonRunAssay = {};	// @button
	var buttonInitDevice = {};	// @button
	var deviceEvent = {};	// @dataSource
	var menuItemTest = {};	// @menuItem
	var assayCartridgeEvent = {};	// @dataSource
	var menuItemCartridge = {};	// @menuItem
	var buttonRegisterCartridges = {};	// @button
	var deviceModelEvent = {};	// @dataSource
	var buttonCreateNewDevice = {};	// @button
	var buttonSaveDevice = {};	// @button
	var buttonCancelDevice = {};	// @button
	var buttonGetStoredData = {};	// @button
	var buttonPasteGCODE = {};	// @button
	var buttonCopyGCODE = {};	// @button
	var assayEvent = {};	// @dataSource
	var documentEvent = {};	// @document
	var buttonDeleteCommand = {};	// @button
	var buttonMoveDown = {};	// @button
	var buttonMoveUp = {};	// @button
	var buttonMoveToBottom = {};	// @button
	var buttonMoveToTop = {};	// @button
	var buttonInsertBelow = {};	// @button
	var buttonInsertAbove = {};	// @button
	var buttonAppendEnd = {};	// @button
	var buttonInsertTop = {};	// @button
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
	
	var clipboard = '';
	
	var brevicodeCommands = {
		'0': 'Start Assay',
		'1': 'Delay',
		'2': 'Move',
		'3': 'Solenoid On',
		'4': 'Device LED On',
		'5': 'Device LED Off',
		'6': 'Device LED Blink',
		'7': 'Sensor LED On',
		'8': 'Sensor LED Off',
		'9': 'Read Sensors',
		'10': 'Read QR Code',
		'11': 'Disable Sensor',
		'12': 'Repeat Begin',
		'13': 'Repeat End',
		'14': 'Status',
		'99': 'Finish Assay'
	}

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
	
	function startStatusMonitoring(that, sparkCoreID) {
		if (statusMonitorID) {
			clearInterval(statusMonitorID);
		}
			
		callSpark(that, 'get_status', [sparkCoreID], function(event) {
				deviceStatus = event.value;
				sources.deviceStatus.sync();
			},
			function(error) {
				return; // ignore error when continuously monitoriing
			}
		);
		
		statusMonitorID = setInterval(function(this_one) {
			callSpark(this_one, 'get_status', [sparkCoreID], function(event) {
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
	
	function validateSerialNumber(serialNumber) {
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
						$$('containerAttributes').show();
					}
					else {
						$$('containerCommand').hide();
						$$('containerAttributes').hide();
					}
				}
			);
		}
		else {
			$$('containerCommand').hide();
			$$('containerAttributes').hide();
		}
		sources.deviceSpark.query('sparkCoreID === :1',
				{
					onSuccess: function(event) {
						if(event.dataSource.ID) {
							$$('containerSparkDevice').show();
							sources.deviceModel.all({onSuccess: function(evt) {return;} });
						}
						else {
							$$('containerSparkDevice').hide();
						}
					},
					onError: function(error) {
						$$('containerSparkDevice').hide();
					},
					params: [dataSource.id]
				}
		);
	}
	
	function getCommandObject() {
		var i, r = {};
		
		r.code = $$('comboboxNewCommand').getValue();
		r.command = convertCodeToCommand(r.code);
		r.params = newParam;
		
		return r;
	}
	
	function convertCommandsToAttribute() {
		var attr = '';
		var i;
		
		for (i = 0; i < brevicode.length; i += 1) {
			attr += brevicode[i].code + (brevicode[i].params ? ',' + brevicode[i].params : '') + (i < brevicode.length - 1 ? '\n' : '');
		}
		
		return attr;
	}
	
	function convertCodeToCommand(code) {
		var cmd = '';
		for (i = 0; i < commands.length; i += 1) {
			if (commands[i].num === code) {
				cmd = commands[i].name;
				break;
			}
		}
		return cmd;
	}

	function convertAttributeToCommands(attr) {
		var cmd, i, p;
		var a = [];
		
		if (attr) {
			cmd = attr.split('\n');
			
			for (i = 0; i < cmd.length; i += 1) {
				if (cmd[i]) {
					p = cmd[i].split(',');
					a.push({ 'code': p[0], 'command': convertCodeToCommand(p[0]), 'params': (p.length > 1 ? p[1] : '') });
				}
			}
		}
		
		return a;
	}
	
	function loadUnusedCartridgesByAssay(assayID, dataSource) {
		dataSource.query('startedOn === null AND assay.ID === :1',
				{
					onSuccess: function(evt) {
						return;
					},
					onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					},
					params: [assayID]
				}
		);
	}

	function loadUnusedCartridgesByID(cartridgeID) {
		if (cartridgeID === '*') {
			sources.cartridgeUnused.query('startedOn === null',
					{
						onSuccess: function(evt) {
							return;
						},
						onError: function(err) {
							notification.error('ERROR: ' + err.error[0].message);
						}
					}
			);
		}
		else {
			sources.cartridgeUnused.query('startedOn === null AND ID === :1',
					{
						onSuccess: function(evt) {
							return;
						},
						onError: function(err) {
							notification.error('ERROR: ' + err.error[0].message);
						},
						params: [cartridgeID]
					}
			);
		}
	}

	function getSparkCoreList(that, notify) {
		callSpark(that, 'get_list_of_cores', [], function(evt) {
				if (notify) {
					notification.log('Core list refreshed');
				}
				sparkCores = evt.response;
				sources.sparkCores.sync();
				clearSparkParameters();
			}
		);
	}

// eventHandlers// @lock

	menuItemResults.click = function menuItemResults_click (event)// @startlock
	{// @endlock
		sources.deviceResults.all({
			onSuccess: function(evt) {
					return;
			}
		});
	};// @lock

	deviceResultsEvent.onCurrentElementChange = function deviceResultsEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.sparkCoreID) {
			callSpark(this, 'get_core_status', [event.dataSource.sparkCoreID], function(evt) {
					if (evt.response.connected) {
						deviceOnline = 'YES' ;
						$$('textFieldResultsDeviceOnline').setBackgroundColor('green');
						sources.deviceOnline.sync();
						$$('containerDeviceResults').show();
						callSpark(this, 'get_archive_size', [event.dataSource.sparkCoreID], function(ev) {
								archiveSize = ev.response.return_value;
								sources.archiveSize.sync();
								if (archiveSize > 0) {
									assayNumber = archiveSize;
									sources.assayNumber.sync();
								}
							}
						);
					}
					else {
						deviceOnline = 'NO' ;
						$$('textFieldResultsDeviceOnline').setBackgroundColor('red');
						sources.deviceOnline.sync();
						$$('containerDeviceResults').hide();
					}
				}
			);
		}
		else {
			deviceOnline = 'NO';
			$$('textFieldResultsDeviceOnline').setBackgroundColor('red');
			sources.deviceOnline.sync();
			$$('containerDeviceResults').hide();
		}
		if (event.dataSource.sparkCoreID) {
		}
	};// @lock

	assayTestEvent.onCurrentElementChange = function assayTestEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadUnusedCartridgesByAssay(event.dataSource.ID, sources.cartridgeUnused);
	};// @lock

	checkboxTestStatus.change = function checkboxTestStatus_change (event)// @startlock
	{// @endlock
		if(this.getValue()) { // turn on continuous status monitoring
			$$('buttonTestStatus').disable();
			startStatusMonitoring($$('buttonTestStatus'), sources.device.sparkCoreID);
		}
		else { // turn off continuous status monitoring
			stopStatusMonitoring();
			$$('buttonTestStatus').enable();
		}
	};// @lock

	buttonTestStatus.click = function buttonTestStatus_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_status', [sources.device.sparkCoreID], function(evt) {
				deviceStatus = evt.value;
				sources.deviceStatus.sync();
			}
		);
	};// @lock

	buttonCancelTest.click = function buttonCancelTest_click (event)// @startlock
	{// @endlock
		callSpark(this, 'cancel_process', [sources.device.sparkCoreID], function(evt) {
				notification.log('Process cancelled');
			}
		);
	};// @lock

	buttonRunAssay.click = function buttonRunAssay_click (event)// @startlock
	{// @endlock
		callSpark(this, 'ready_to_run_assay', [sources.device.sparkCoreID], function(evt) {
				if (evt.response.return_value !== -1) {
					callSpark(this, 'run_assay', [sources.device.sparkCoreID], function(e) {
							notification.log('Assay started');
						}
					);
				}
				else {
					notification.error('Device not ready - please initialize and insert cartridge');
				}
			}
		);
	};// @lock

	buttonInitDevice.click = function buttonInitDevice_click (event)// @startlock
	{// @endlock
		callSpark(this, 'initialize_device', [sources.device.sparkCoreID], function(evt) {
				notification.log('Device initialization started');
			}
		);
	};// @lock

	deviceEvent.onCurrentElementChange = function deviceEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.sparkCoreID) {
			callSpark(this, 'get_core_status', [event.dataSource.sparkCoreID], function(evt) {
					if (evt.response.connected) {
						deviceOnline = 'YES' ;
						$$('textFieldDeviceOnline').setBackgroundColor('green');
						sources.deviceOnline.sync();
						$$('containerTestActions').show();
					}
					else {
						deviceOnline = 'NO' ;
						$$('textFieldDeviceOnline').setBackgroundColor('red');
						sources.deviceOnline.sync();
						$$('containerTestActions').hide();
					}
				}
			);
		}
		else {
			deviceOnline = 'NO';
			$$('textFieldDeviceOnline').setBackgroundColor('red');
			sources.deviceOnline.sync();
			$$('containerTestActions').hide();
		}
	};// @lock

	menuItemTest.click = function menuItemTest_click (event)// @startlock
	{// @endlock
		sources.assayTest.all({
			onSuccess: function(evt) {
					loadUnusedCartridgesByAssay(evt.dataSource.ID, sources.cartridgeUnused);
			}
		});

		sources.device.all({
			onSuccess: function(evt) {
					return;
			}
		});
	};// @lock

	assayCartridgeEvent.onCurrentElementChange = function assayCartridgeEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadUnusedCartridgesByAssay(event.dataSource.ID, sources.cartridge);
	};// @lock

	menuItemCartridge.click = function menuItemCartridge_click (event)// @startlock
	{// @endlock
		sources.assayCartridge.all({
			onSuccess: function(evt) {
					loadUnusedCartridgesByAssay(evt.dataSource.ID, sources.cartridge);
			}
		});
	};// @lock

	buttonRegisterCartridges.click = function buttonRegisterCartridges_click (event)// @startlock
	{// @endlock
		sources.cartridge.manufacture(
			{
				onSuccess: function(evt) {
						notification.log(evt.result + ' cartridges registered');
						loadUnusedCartridgesByAssay(sources.assayCartridge.ID, sources.cartridge);
					},
				onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					}
			},
			{
				assayID: sources.assayCartridge.ID,
				quantity: (numberOfCartridges > 10 ? 10 : numberOfCartridges)
			}
		);
	};// @lock

	deviceModelEvent.onCurrentElementChange = function deviceModelEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		sources.deviceSpark.deviceModel.set(event.dataSource);
	};// @lock

	buttonCreateNewDevice.click = function buttonCreateNewDevice_click (event)// @startlock
	{// @endlock
		sources.deviceSpark.addNewElement();
		sources.deviceSpark.sparkCoreID = sources.sparkCores.id;
		$$('containerSparkDevice').show();
	};// @lock

	buttonSaveDevice.click = function buttonSaveDevice_click (event)// @startlock
	{// @endlock
		var r = validateSerialNumber(sources.deviceSpark.serialNumber);
		if (r.valid) {
			sources.deviceSpark.deviceModel.set(sources.deviceModel);
			sources.deviceSpark.save(
				{
					onSuccess: function(evt) {
							notification.log('Device saved');
						},
					onError: function(err) {
							notification.error('ERROR: ' + err.error[0].message);
						}
				}
			);
		}
		else {
			notification.error(r.errorMsg);	
		}
	};// @lock

	buttonCancelDevice.click = function buttonCancelDevice_click (event)// @startlock
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

	buttonGetStoredData.click = function buttonGetStoredData_click (event)// @startlock
	{// @endlock
		if (assayNumber > 0 && assayNumber <= archiveSize) {
			callSpark(this, 'request_archive_data', [sources.deviceResults.sparkCoreID, assayNumber - 1], function(evt) {
					notification.log('Archived assay results retrieved');
					$$('textFieldAssayResults').setValue(evt.data.join('\n'));
				}
			);
		}
		else {
			notification.error('Assay record number out of range');
		}
	};// @lock

	buttonPasteGCODE.click = function buttonPasteGCODE_click (event)// @startlock
	{// @endlock
		brevicode = convertAttributeToCommands(clipboard);
		sources.brevicode.sync();
	};// @lock

	buttonCopyGCODE.click = function buttonCopyGCODE_click (event)// @startlock
	{// @endlock
		clipboard = convertCommandsToAttribute();
		notification.log('Command list copied');
	};// @lock

	assayEvent.onCurrentElementChange = function assayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		brevicode = convertAttributeToCommands(event.dataSource.GCODE);
		sources.brevicode.sync();
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		commands = [
			{
				num: '0',
				name: 'Start Assay',
				description: 'Starts the assay. Required to be the first command. Assay executes until Finish Assay command. Parameters are (sensor integration time, sensor gain).'
			},
			{
				num: '1',
				name: 'Delay',
				description: 'Waits for specified period of time. Parameter is (delay in milliseconds).'
			},
			{
				num: '2',
				name: 'Move',
				description: 'Moves the stage a specified number of steps at a specified speed. Parameters are (number of steps, step delay time in microseconds).'
			},
			{
				num: '3',
				name: 'Solenoid On',
				description: 'Energizes the solenoid for a specified amount of time. Parameter is (energize period in milliseconds).'
			},
			{
				num: '4',
				name: 'Device LED On',
				description: 'Turns on the device LED, which is visible outside the device. No parameters.'
			},
			{
				num: '5',
				name: 'Device LED Off',
				description: 'Turns off the device LED. No parameters.'
			},
			{
				num: '6',
				name: 'Device LED Blink',
				description: 'Blinks the device LED at a specified rate. Parameter is (period in milliseconds between change in LED state).'
			},
			{
				num: '7',
				name: 'Sensor LED On',
				description: 'Turns on the sensor LED at a given power. Parameter is (power, from 0 to 255).'
			},
			{
				num: '8',
				name: 'Sensor LED Off',
				description: 'Turns off the sensor LED. No parameters.'
			},
			{
				num: '9',
				name: 'Read Sensors',
				description: 'Takes readings from the sensors. Parameter is (number of samples, from 1 to 10).'
			},
			{
				num: '10',
				name: 'Read QR Code',
				description: 'Reads the cartridge QR code. No parameters. [NOT IMPLEMENTED]'
			},
			{
				num: '11',
				name: 'Disable Sensor',
				description: 'Disables the sensors, switching them to low-power mode. No parameters.'
			},
			{
				num: '12',
				name: 'Repeat Begin',
				description: 'Begins a block of commands that will be repeated a specified number of times. Nesting is acceptable. Parameter is (number of interations).'
			},
			{
				num: '12',
				name: 'Repeat End',
				description: 'Ends the innermost block of repeated commands. No parameters.'
			},
			{
				num: '12',
				name: 'Status',
				description: 'Changes the device status register, which used in remote monitoring. DO NOT USE COMMAS! Parameters are (message length, message text).'
			},
			{
				num: '99',
				name: 'Finish Assay',
				description: 'Finishes the assay. Required to be the final command. No parameters.'
			}
		];
		sources.commands.sync();
	};// @lock

	buttonDeleteCommand.click = function buttonDeleteCommand_click (event)// @startlock
	{// @endlock
		brevicode.splice(sources.brevicode.getPosition(), 1);
		sources.brevicode.sync()
	};// @lock

	buttonMoveDown.click = function buttonMoveDown_click (event)// @startlock
	{// @endlock
		var code;
		var pos = sources.brevicode.getPosition();
		if (pos < brevicode.length - 1) {
			code = brevicode.splice(pos, 1);
			pos += 1;
			pos = (pos > brevicode.length ? brevicode.length : pos);
			brevicode.splice(pos, 0, code[0]);
			sources.brevicode.select(pos);
			sources.brevicode.sync();
		}
	};// @lock

	buttonMoveUp.click = function buttonMoveUp_click (event)// @startlock
	{// @endlock
		var code;
		var pos = sources.brevicode.getPosition();
		if (pos > 0) {
			code = brevicode.splice(sources.brevicode.getPosition(), 1);
			pos -= 1;
			pos = (pos < 0 ? 0 : pos);
			brevicode.splice(pos, 0, code[0]);
			sources.brevicode.select(pos);
			sources.brevicode.sync();
		}
	};// @lock

	buttonMoveToBottom.click = function buttonMoveToBottom_click (event)// @startlock
	{// @endlock
		brevicode.push(brevicode.splice(sources.brevicode.getPosition(), 1)[0]);
		sources.brevicode.select(brevicode.length - 1);
		sources.brevicode.sync()
	};// @lock

	buttonMoveToTop.click = function buttonMoveToTop_click (event)// @startlock
	{// @endlock
		brevicode.splice(0, 0, brevicode.splice(sources.brevicode.getPosition(), 1)[0]);
		sources.brevicode.select(0);
		sources.brevicode.sync()
	};// @lock

	buttonInsertBelow.click = function buttonInsertBelow_click (event)// @startlock
	{// @endlock
		var pos = sources.brevicode.getPosition() + 1;
		brevicode.splice(pos, 0, getCommandObject());
		sources.brevicode.select(pos);
		sources.brevicode.sync()
	};// @lock

	buttonInsertAbove.click = function buttonInsertAbove_click (event)// @startlock
	{// @endlock
		var pos = sources.brevicode.getPosition();
		pos = (pos < 0 ? 0 : pos);
		brevicode.splice(pos, 0, getCommandObject());
		sources.brevicode.select(pos);
		sources.brevicode.sync()
	};// @lock

	buttonAppendEnd.click = function buttonAppendEnd_click (event)// @startlock
	{// @endlock
		brevicode.push(getCommandObject());
		sources.brevicode.select(brevicode.length - 1);
		sources.brevicode.sync()
	};// @lock

	buttonInsertTop.click = function buttonInsertTop_click (event)// @startlock
	{// @endlock
		brevicode.splice(0, 0, getCommandObject());
		sources.brevicode.select(0);
		sources.brevicode.sync()
	};// @lock

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
		sources.assay.GCODE = convertCommandsToAttribute();
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
		sources.assay.addNewElement();
	};// @lock

	sparkCoresEvent.onCurrentElementChange = function sparkCoresEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		changeSparkCore(event.dataSource);
	};// @lock

	menuItemDevice.click = function menuItemDevice_click (event)// @startlock
	{// @endlock
		getSparkCoreList(this, false);
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
		getSparkCoreList(this, true);
	};// @lock

	checkboxMonitorStatus.change = function checkboxMonitorStatus_change (event)// @startlock
	{// @endlock
		if(this.getValue()) { // turn on continuous status monitoring
			$$('buttonGetStatus').disable();
			startStatusMonitoring($$('buttonGetStatus'), sources.sparkCores.id);
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
		var serial_number = window.prompt('Enter serial number:', 'XXXX-XXXX-XXXX-XXXX');
		if (serial_number) {
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
	WAF.addListener("menuItemResults", "click", menuItemResults.click, "WAF");
	WAF.addListener("deviceResults", "onCurrentElementChange", deviceResultsEvent.onCurrentElementChange, "WAF");
	WAF.addListener("assayTest", "onCurrentElementChange", assayTestEvent.onCurrentElementChange, "WAF");
	WAF.addListener("checkboxTestStatus", "change", checkboxTestStatus.change, "WAF");
	WAF.addListener("buttonTestStatus", "click", buttonTestStatus.click, "WAF");
	WAF.addListener("buttonCancelTest", "click", buttonCancelTest.click, "WAF");
	WAF.addListener("buttonRunAssay", "click", buttonRunAssay.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
	WAF.addListener("device", "onCurrentElementChange", deviceEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemTest", "click", menuItemTest.click, "WAF");
	WAF.addListener("assayCartridge", "onCurrentElementChange", assayCartridgeEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemCartridge", "click", menuItemCartridge.click, "WAF");
	WAF.addListener("buttonRegisterCartridges", "click", buttonRegisterCartridges.click, "WAF");
	WAF.addListener("deviceModel", "onCurrentElementChange", deviceModelEvent.onCurrentElementChange, "WAF");
	WAF.addListener("buttonCreateNewDevice", "click", buttonCreateNewDevice.click, "WAF");
	WAF.addListener("buttonSaveDevice", "click", buttonSaveDevice.click, "WAF");
	WAF.addListener("buttonCancelDevice", "click", buttonCancelDevice.click, "WAF");
	WAF.addListener("buttonGetStoredData", "click", buttonGetStoredData.click, "WAF");
	WAF.addListener("buttonPasteGCODE", "click", buttonPasteGCODE.click, "WAF");
	WAF.addListener("buttonCopyGCODE", "click", buttonCopyGCODE.click, "WAF");
	WAF.addListener("assay", "onCurrentElementChange", assayEvent.onCurrentElementChange, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("buttonDeleteCommand", "click", buttonDeleteCommand.click, "WAF");
	WAF.addListener("buttonMoveDown", "click", buttonMoveDown.click, "WAF");
	WAF.addListener("buttonMoveUp", "click", buttonMoveUp.click, "WAF");
	WAF.addListener("buttonMoveToBottom", "click", buttonMoveToBottom.click, "WAF");
	WAF.addListener("buttonMoveToTop", "click", buttonMoveToTop.click, "WAF");
	WAF.addListener("buttonInsertBelow", "click", buttonInsertBelow.click, "WAF");
	WAF.addListener("buttonInsertAbove", "click", buttonInsertAbove.click, "WAF");
	WAF.addListener("buttonAppendEnd", "click", buttonAppendEnd.click, "WAF");
	WAF.addListener("buttonInsertTop", "click", buttonInsertTop.click, "WAF");
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
	WAF.addListener("checkboxMonitorStatus", "change", checkboxMonitorStatus.change, "WAF");
	WAF.addListener("buttonGetStatus", "click", buttonGetStatus.click, "WAF");
	WAF.addListener("buttonCancelProcess", "click", buttonCancelProcess.click, "WAF");
	WAF.addListener("buttonSensorData", "click", buttonSensorData.click, "WAF");
	WAF.addListener("buttonSetSerialNumber", "click", buttonSetSerialNumber.click, "WAF");
	WAF.addListener("buttonRegisterDevice", "click", buttonRegisterDevice.click, "WAF");
// @endregion
};// @endlock