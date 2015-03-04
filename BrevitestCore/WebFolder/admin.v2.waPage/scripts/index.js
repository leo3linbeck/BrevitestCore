
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var assayDataEvent = {};	// @dataSource
	var menuItemData = {};	// @menuItem
	var menuItemFlash = {};	// @menuItem
	var deviceFlashEvent = {};	// @dataSource
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
	var buttonPasteBCODE = {};	// @button
	var buttonCopyBCODE = {};	// @button
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
	
	var brevitestCommands = [
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
			num: '13',
			name: 'Repeat End',
			description: 'Ends the innermost block of repeated commands. No parameters.'
		},
		{
			num: '14',
			name: 'Status',
			description: 'Changes the device status register, which used in remote monitoring. Parameters are (message length, message text).'
		},
		{
			num: '99',
			name: 'Finish Assay',
			description: 'Finishes the assay. Required to be the final command. No parameters.'
		}
	];
	
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
//		if (dataSource.connected) {
//			callSpark(this, 'get_firmware_version', [sources.sparkCores.id], function(evt) {
//					if (firmwareVersion === evt.response.return_value) {
//						$$('containerCommand').show();
//						$$('containerAttributes').show();
//					}
//					else {
//						$$('containerCommand').hide();
//						$$('containerAttributes').hide();
//					}
//				}
//			);
//		}
//		else {
//			$$('containerCommand').hide();
//			$$('containerAttributes').hide();
//		}
		sources.deviceSpark.query('sparkCoreID === :1',
				{
					onSuccess: function(event) {
						if(event.dataSource.ID) {
							$$('containerSparkDevice').show();
							$$('containerCommand').show();
							$$('containerAttributes').show();
						}
						else {
							$$('containerSparkDevice').hide();
							$$('containerCommand').hide();
							$$('containerAttributes').hide();
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
		var c, cmd, i, indx, p;
		var a = [];
		
		if (attr) {
			cmd = attr.split('\n');
			
			for (i = 0; i < cmd.length; i += 1) {
				if (cmd[i]) {
					indx = cmd[i].indexOf(',');
					if (indx === -1) {
						c = cmd[i];
						p = '';
					}
					else {
						c = cmd[i].substr(0, indx);
						p = cmd[i].substr(indx + 1);
					}
					a.push({ 'code': c, 'command': convertCodeToCommand(c), 'params': p });
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

	function loadCompletedTestsByAssay(assayID, dataSource) {
		dataSource.query('startedOn != null AND finishedOn != null AND assay.ID === :1',
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
	
	function saveDevice(callback) {
		var r = validateSerialNumber(sources.deviceSpark.serialNumber);
		if (r.valid) {
			sources.deviceSpark.deviceModel.set(sources.deviceModel);
			sources.deviceSpark.online = sources.sparkCores.connected;
			sources.deviceSpark.save(
				{
					onSuccess: function(event) {
							if (callback) {
								callback(event);
							}
							else {
								notification.log('Device saved');
							}
						},
					onError: function(error) {
							notification.error('ERROR: ' + error.error[0].message);
						}
				}
			);
		}
		else {
			notification.error(r.errorMsg);	
		}
	}
	
	function registerDevice() {
		if (sources.sparkCores.connected) {
			if (sources.deviceSpark.registeredOn) {
				notification.error('This device is already registered');
			}
			else {
				var user = WAF.directory.currentUser();
				if (user) {
					sources.deviceSpark.register(
						{
							onSuccess: function(event) {
									sources.deviceSpark.serverRefresh({ onSuccess: function() {return;}, forceReload: true });
									if (event.result) {
										notification.log('Device registered');
									}
									else {
										notification.error('ERROR: Device not registered');
									}
								},
							onError: function(err) {
									notification.error('SYSTEM ERROR: ' + err.error[0].message);
								}
						},
						{
							username: user.userName,
							deviceID: sources.deviceSpark.ID,
							sparkCoreID: sources.sparkCores.id,
							sparkCoreName: sources.sparkCores.name,
							sparkCoreLastHeard: sources.sparkCores.last_heard,
							serialNumber: sources.deviceSpark.serialNumber
						}
					);
				}
				else {
					notification.error('You must be signed in to register cartridges');
				}
			}
		}
		else {
			notification.error('Device must be online to register');
		}
	}

// eventHandlers// @lock

	assayDataEvent.onCurrentElementChange = function assayDataEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadCompletedTestsByAssay(event.dataSource.ID, sources.test);
	};// @lock

	menuItemData.click = function menuItemData_click (event)// @startlock
	{// @endlock
		sources.assayData.all({ onSuccess: function(evt) {return;} });
	};// @lock

	menuItemFlash.click = function menuItemFlash_click (event)// @startlock
	{// @endlock
		sources.deviceFlash.all({ onSuccess: function(evt) {return;} });
	};// @lock

	deviceFlashEvent.onCurrentElementChange = function deviceFlashEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.sparkCoreID) {
			if (event.dataSource.online) {
				deviceOnline = 'YES - ONLINE' ;
				sources.deviceOnline.sync();
				$$('textFieldFlashDeviceOnline').setBackgroundColor('green');
				$$('containerDeviceFlash').show();
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
				deviceOnline = 'NO - OFFLINE' ;
				sources.deviceOnline.sync();
				$$('textFieldFlashDeviceOnline').setBackgroundColor('red');
				$$('containerDeviceFlash').hide();
			}
		}
		else {
			deviceOnline = 'UNREGISTERED DEVICE';
			sources.deviceOnline.sync();
			$$('textFieldFlashDeviceOnline').setBackgroundColor('red');
			$$('containerDeviceFlash').hide();
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
		var user = WAF.directory.currentUser();
		
		if (user) {
			sources.test.start(
				{
					onSuccess: function(evt) {
							if (evt.result.success) {
								notification.log('Test started');
								loadUnusedCartridgesByAssay(sources.assayTest.ID, sources.cartridgeUnused);
							}
							else {
								notification.error('ERROR: ' + evt.result.message + ' - test not started');
							}
						},
					onError: function(err) {
							notification.error('SYSTEM ERROR: ' + err.error[0].message);
						}
				},
				{
					username: user.userName,
					deviceID: sources.device.ID,
					cartridgeID: sources.cartridgeUnused.ID
				}
			);
		}
		else {
			notification.error('You must be signed in to run a test');	
		}
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
			if (event.dataSource.online) {
				deviceOnline = 'YES - ONLINE' ;
				sources.deviceOnline.sync();
				$$('textFieldDeviceOnline').setBackgroundColor('green');
				$$('containerTestActions').show();
			}
			else {
				deviceOnline = 'NO - OFFLINE' ;
				sources.deviceOnline.sync();
				$$('textFieldDeviceOnline').setBackgroundColor('red');
				$$('containerTestActions').hide();
			}
		}
		else {
			deviceOnline = 'UNREGISTERED DEVICE';
			sources.deviceOnline.sync();
			$$('textFieldDeviceOnline').setBackgroundColor('red');
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
		var user = WAF.directory.currentUser();
		if (user) {
			sources.cartridge.manufacture(
				{
					onSuccess: function(evt) {
							if (evt.result) {
								notification.log(evt.result + ' cartridges registered');
								loadUnusedCartridgesByAssay(sources.assayCartridge.ID, sources.cartridge);
							}
							else {
								notification.error('ERROR: No cartridges registered');
							}
						},
					onError: function(err) {
							notification.error('SYSTEM ERROR: ' + err.error[0].message);
						}
				},
				{
					username: user.userName,
					assayID: sources.assayCartridge.ID,
					quantity: (numberOfCartridges > 10 ? 10 : numberOfCartridges)
				}
			);
		}
		else {
			notification.error('You must be signed in to register cartridges');
		}
	};// @lock

	deviceModelEvent.onCurrentElementChange = function deviceModelEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		sources.deviceSpark.deviceModel.set(event.dataSource);
		sources.deviceSpark.serverRefresh({ onSuccess: function() {return;} });
	};// @lock

	buttonCreateNewDevice.click = function buttonCreateNewDevice_click (event)// @startlock
	{// @endlock
		sources.deviceSpark.addNewElement();
		sources.deviceSpark.sparkCoreID = sources.sparkCores.id;
		sources.deviceModel.all({
			onSuccess: function(evt) {
					$$('containerSparkDevice').show();
				},
			onError: function(err) {
					notification.error('SYSTEM ERROR: ' + err.error[0].message);
				}
		});

	};// @lock

	buttonSaveDevice.click = function buttonSaveDevice_click (event)// @startlock
	{// @endlock
		saveDevice();
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
			callSpark(this, 'request_archive_data', [sources.deviceFlash.sparkCoreID, assayNumber - 1], function(evt) {
					notification.log('Archived assay results retrieved from device flash');
					$$('textFieldAssayFlash').setValue(evt.data.join('\n'));
				}
			);
		}
		else {
			notification.error('Assay record number out of range');
		}
	};// @lock

	buttonPasteBCODE.click = function buttonPasteBCODE_click (event)// @startlock
	{// @endlock
		brevicode = convertAttributeToCommands(clipboard);
		sources.brevicode.sync();
	};// @lock

	buttonCopyBCODE.click = function buttonCopyBCODE_click (event)// @startlock
	{// @endlock
		clipboard = convertCommandsToAttribute();
		notification.log('Command list copied');
	};// @lock

	assayEvent.onCurrentElementChange = function assayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		brevicode = convertAttributeToCommands(event.dataSource.BCODE);
		sources.brevicode.sync();
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		commands = brevitestCommands;
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
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
					}
			}
		);
	};// @lock

	buttonSaveAssay.click = function buttonSaveAssay_click (event)// @startlock
	{// @endlock
		sources.assay.BCODE = convertCommandsToAttribute();
		sources.assay.save(
			{
				onSuccess: function(evt) {
						notification.log('Assay saved');
					},
				onError: function(err) {
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
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
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
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
		sources.deviceModel.all({ onSuccess: function() {return;} });
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
				notification.log('Cancelling process');
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

	buttonRegisterDevice.click = function buttonRegisterDevice_click (event)// @startlock
	{// @endlock
		saveDevice(registerDevice);
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("assayData", "onCurrentElementChange", assayDataEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemData", "click", menuItemData.click, "WAF");
	WAF.addListener("menuItemFlash", "click", menuItemFlash.click, "WAF");
	WAF.addListener("deviceFlash", "onCurrentElementChange", deviceFlashEvent.onCurrentElementChange, "WAF");
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
	WAF.addListener("buttonPasteBCODE", "click", buttonPasteBCODE.click, "WAF");
	WAF.addListener("buttonCopyBCODE", "click", buttonCopyBCODE.click, "WAF");
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
	WAF.addListener("buttonRegisterDevice", "click", buttonRegisterDevice.click, "WAF");
// @endregion
};// @endlock
