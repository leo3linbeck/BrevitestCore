﻿
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonRegisterCartridge = {};	// @button
	var buttonResetData = {};	// @button
	var iconUpdate = {};	// @icon
	var brevicodeEvent = {};	// @dataSource
	var monitorStatusEvent = {};	// @dataSource
	var buttonEraseAllFlashData = {};	// @button
	var buttonCheckCalibration = {};	// @button
	var assayDataEvent = {};	// @dataSource
	var menuItemData = {};	// @menuItem
	var menuItemFlash = {};	// @menuItem
	var deviceFlashEvent = {};	// @dataSource
	var assayTestEvent = {};	// @dataSource
	var checkboxTestStatus = {};	// @checkbox
	var buttonTestStatus = {};	// @button
	var buttonCancelTest = {};	// @button
	var buttonRunTest = {};	// @button
	var buttonInitDevice = {};	// @button
	var deviceEvent = {};	// @dataSource
	var menuItemTest = {};	// @menuItem
	var assayCartridgeEvent = {};	// @dataSource
	var menuItemCartridge = {};	// @menuItem
	var buttonMakeCartridges = {};	// @button
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
					if (errorCallback) {
						errorCallback();
					}
					else {
						notification.error('Command failed to complete' + (event.message ? ' - ' + event.message : ''));
					}
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
						if (event.dataSource.online) {
							$$('containerCommand').show();
							$$('containerAttributes').show();
						}
						else {
							$$('containerCommand').hide();
							$$('containerAttributes').hide();
						}
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
		
		r.code = newCode;
		r.command = convertCodeToCommand(r.code);
		r.params = newParams;
		
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
	
	function loadCartridgesByAssay(assayID, raw, registered) {
		if (raw) {
			raw.query('registeredOn === null AND assay.ID === :1',
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
		
		if (registered) {
			registered.query('registeredOn !== null AND startedOn === null AND assay.ID === :1',
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
		dataSource.query('finishedOn != null AND assay.ID === :1',
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
										$$('containerCommand').show();
										$$('containerAttributes').show();
									}
									else {
										notification.error('ERROR: Device not registered');
										$$('containerCommand').hide();
										$$('containerAttributes').hide();
									}
								},
							onError: function(err) {
									notification.error('SYSTEM ERROR: ' + err.error[0].message);
									$$('containerCommand').hide();
									$$('containerAttributes').hide();
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
					notification.error('You must be signed in to register a device');
				}
			}
		}
		else {
			notification.error('Device must be online to register');
		}
	}
	
	function checkDeviceCalibration() {
		if (sources.sparkCores.connected) {
			var user = WAF.directory.currentUser();
			if (user) {
				sources.deviceSpark.checkCalibration(
					{
						onSuccess: function(event) {
								sources.deviceSpark.serverRefresh({ onSuccess: function() {return;}, forceReload: true });
								if (event.result) {
									notification.log('Device has moved to calibration point');
								}
								else {
									notification.error('ERROR: Device not calibrated');
								}
							},
						onError: function(err) {
								notification.error('SYSTEM ERROR: ' + err.error[0].message);
							}
					},
					{
						username: user.userName,
						deviceID: sources.deviceSpark.ID
					}
				);
			}
			else {
				notification.error('You must be signed in to calibrate a device');
			}
		}
	}
		
//
//
//
//
// eventHandlers// @lock

	buttonRegisterCartridge.click = function buttonRegisterCartridge_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		if (user) {
			sources.cartridgeRaw.register(
				{
					onSuccess: function(evt) {
							if (evt.result) {
								notification.log('Cartridge registered');
								loadCartridgesByAssay(sources.assayCartridge.ID, sources.cartridgeRaw, sources.cartridgeRegistered);
							}
							else {
								notification.error('ERROR: Cartridge not registered');
							}
						},
					onError: function(err) {
							notification.error('SYSTEM ERROR: ' + err.error[0].message);
						}
				},
				{
					username: user.userName,
					cartridgeID: sources.cartridgeRaw.ID
				}
			);
		}
		else {
			notification.error('You must be signed in to register a cartridge');
		}
	};// @lock

	buttonResetData.click = function buttonResetData_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			if (window.confirm('Are you sure you want to erase all data in the database and add back some faux data? This action cannot be undone.')) {
				callSpark(this, 'initialize_database', [], function(evt) {
						notification.log('Database erased and initialized');
					}
				);
			}
		}
		else {
			notification.error('You must be signed in to reset the database');
		}
	};// @lock

	iconUpdate.click = function iconUpdate_click (event)// @startlock
	{// @endlock
		brevicode[sources.brevicode.getPosition()] = getCommandObject();
		sources.brevicode.sync();
	};// @lock
//
//
//
//
	brevicodeEvent.onCurrentElementChange = function brevicodeEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		newCode = event.dataSource.code;
		newParams = event.dataSource.params;
		sources.newCode.sync();
		sources.newParams.sync();
	};// @lock

	monitorStatusEvent.onAttributeChange = function monitorStatusEvent_onAttributeChange (event)// @startlock
	{// @endlock
		if (monitorStatus) {
			$$('buttonTestStatus').disable();
			$$('buttonGetStatus').disable();
		}
		else {
			$$('buttonTestStatus').enable();
			$$('buttonGetStatus').enable();
		}

	};// @lock

	buttonEraseAllFlashData.click = function buttonEraseAllFlashData_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			if (window.confirm('Are you sure you want to erase all assay data in the flash memory of this device? This action cannot be undone.')) {
				callSpark(this, 'erase_archived_data', [sources.deviceFlash.sparkCoreID], function(evt) {
						notification.log('Archived data erased');
						assayNumber = 0;
						sources.assayNumber.sync();
						archiveSize = 0;
						sources.archiveSize.sync();
						$$('textFieldTestFlash').setValue('');
					}
				);
			}
		}
		else {
			notification.error('You must be signed in to erase the flash memory on a device');
		}
	};// @lock

	buttonCheckCalibration.click = function buttonCheckCalibration_click (event)// @startlock
	{// @endlock
		saveDevice(checkDeviceCalibration);
	};// @lock

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
		if (sources.deviceFlash.length === 0) {
			sources.deviceFlash.all({ onSuccess: function(evt) {return;} });
		}
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
		loadCartridgesByAssay(event.dataSource.ID, null, sources.cartridgeRegistered);
	};// @lock

	checkboxTestStatus.change = function checkboxTestStatus_change (event)// @startlock
	{// @endlock
		if(monitorStatus) { // turn on continuous status monitoring
			startStatusMonitoring($$('buttonTestStatus'), sources.device.sparkCoreID);
		}
		else { // turn off continuous status monitoring
			stopStatusMonitoring();
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

	buttonRunTest.click = function buttonRunTest_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			spinner.spin(this.domNode);
			sources.test.start(
				{
					onSuccess: function(evt) {
							spinner.stop();
							if (evt.result.success) {
								notification.log('Test started');
								loadCartridgesByAssay(sources.assayTest.ID, null, sources.cartridgeRegistered);
							}
							else {
								notification.error('ERROR: ' + evt.result.message + ' - test not started');
							}
						},
					onError: function(err) {
							spinner.stop();
							notification.error('SYSTEM ERROR: ' + err.error[0].message);
						}
				},
				{
					username: user.userName,
					deviceID: sources.device.ID,
					cartridgeID: sources.cartridgeRegistered.ID
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
		if (sources.assayTest.length === 0) {
			sources.assayTest.all({
				onSuccess: function(evt) {
					loadCartridgesByAssay(evt.dataSource.ID, null, sources.cartridgeRegistered);
				}
			});
		}
		
		if (sources.device.length === 0) {
			sources.device.all({
				onSuccess: function(evt) {
						return;
				}
			});
		}
	};// @lock

	assayCartridgeEvent.onCurrentElementChange = function assayCartridgeEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadCartridgesByAssay(event.dataSource.ID, sources.cartridgeRaw, sources.cartridgeRegistered);
	};// @lock

	menuItemCartridge.click = function menuItemCartridge_click (event)// @startlock
	{// @endlock
		if (sources.assayCartridge.length === 0) {
			sources.assayCartridge.all({
				onSuccess: function(evt) {
						loadCartridgesByAssay(evt.dataSource.ID, sources.cartridgeRaw, sources.cartridgeRegistered);
				}
			});
		}
	};// @lock

	buttonMakeCartridges.click = function buttonMakeCartridges_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		if (user) {
			if (numberOfCartridges > 10) {
				notification.error('You cannot make more than 10 cartridges at a time');
			}
			else {
				sources.cartridgeRaw.manufacture(
					{
						onSuccess: function(evt) {
								if (evt.result) {
									notification.log(evt.result + ' cartridges registered');
									loadCartridgesByAssay(sources.assayCartridge.ID, sources.cartridgeRaw);
									sources.assayTest.dispatch('onCurrentElementChange');
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
			callSpark(this, 'request_test_data', [sources.deviceFlash.sparkCoreID, assayNumber - 1], function(evt) {
					notification.log('Test results retrieved from device flash');
					$$('textFieldTestFlash').setValue(evt.value);
				}
			);
		}
		else {
			notification.error('Test number out of range');
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
		if (commands.length === 0) {
			spark.get_BCODE_commandsAsync({
				'onSuccess': function(evt) {
					if (evt.success) {
						commands = evt.commands;
						sources.commands.sync();
						sources.assay.dispatch('onCurrentElementChange');
					}
					else {
						notification.error('ERROR: BCODE commands failed to load');
					}
				},
				'onError': function(err) {
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
				}
			});
		}
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
		if (sources.sparkCores.length === 0) {
			getSparkCoreList(this, false);
		}
		
		if (sources.deviceModel.length === 0) {
			sources.deviceModel.all({ onSuccess: function() {return;} });
		}
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
		if(monitorStatus) { // turn on continuous status monitoring
			startStatusMonitoring($$('buttonGetStatus'), sources.sparkCores.id);
		}
		else { // turn off continuous status monitoring
			stopStatusMonitoring();
		}
	};// @lock

	buttonGetStatus.click = function buttonGetStatus_click (event)// @startlock
	{// @endlock
		callSpark(this, 'get_status', [sources.sparkCores.id], function(evt) {
				deviceStatus = evt.value;
				sources.deviceStatus.sync();
			},
			function(err) {
				return;	
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
	WAF.addListener("buttonRegisterCartridge", "click", buttonRegisterCartridge.click, "WAF");
	WAF.addListener("buttonResetData", "click", buttonResetData.click, "WAF");
	WAF.addListener("iconUpdate", "click", iconUpdate.click, "WAF");
	WAF.addListener("brevicode", "onCurrentElementChange", brevicodeEvent.onCurrentElementChange, "WAF");
	WAF.addListener("monitorStatus", "onAttributeChange", monitorStatusEvent.onAttributeChange, "WAF");
	WAF.addListener("buttonEraseAllFlashData", "click", buttonEraseAllFlashData.click, "WAF");
	WAF.addListener("buttonCheckCalibration", "click", buttonCheckCalibration.click, "WAF");
	WAF.addListener("assayData", "onCurrentElementChange", assayDataEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemData", "click", menuItemData.click, "WAF");
	WAF.addListener("menuItemFlash", "click", menuItemFlash.click, "WAF");
	WAF.addListener("deviceFlash", "onCurrentElementChange", deviceFlashEvent.onCurrentElementChange, "WAF");
	WAF.addListener("assayTest", "onCurrentElementChange", assayTestEvent.onCurrentElementChange, "WAF");
	WAF.addListener("checkboxTestStatus", "change", checkboxTestStatus.change, "WAF");
	WAF.addListener("buttonTestStatus", "click", buttonTestStatus.click, "WAF");
	WAF.addListener("buttonCancelTest", "click", buttonCancelTest.click, "WAF");
	WAF.addListener("buttonRunTest", "click", buttonRunTest.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
	WAF.addListener("device", "onCurrentElementChange", deviceEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemTest", "click", menuItemTest.click, "WAF");
	WAF.addListener("assayCartridge", "onCurrentElementChange", assayCartridgeEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemCartridge", "click", menuItemCartridge.click, "WAF");
	WAF.addListener("buttonMakeCartridges", "click", buttonMakeCartridges.click, "WAF");
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
