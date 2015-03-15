
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var icon2 = {};	// @icon
	var buttonReadyToTest = {};	// @button
	var buttonTestResults = {};	// @button
	var button1 = {};	// @button
	var buttonScanCartridge = {};	// @button
	var container1 = {};	// @matrix
	var icon1 = {};	// @icon
	var buttonStartTest = {};	// @button
	var buttonMonitorTest = {};	// @button
	var buttonRun = {};	// @button
// @endregion// @endlock

	var spinnerOpts = {
		color: '#CCC'
	};
	var spinner = new Spinner(spinnerOpts);
	
	var notification = humane.create({ timeout: 2000, baseCls: 'humane-libnotify' });
	notification.error = humane.spawn({ addnCls: 'humane-libnotify-error', clickToClose: true, timeout: 0 });
	
	var statusMonitorID = null;
	var firmwareVersion = 8;

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
	
	function startTestMonitor(testID, cartridgeID) {
		sources.test.monitor(
			{
				onSuccess: function(evt) {
						if (evt.result.success) {
							notification.log('Test completed');
						}
						else {
							notification.error('ERROR: ' + evt.result.message + ' - test not completed');
						}
					},
				onError: function(err) {
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
					}
			},
			{
				testID: testID,
				cartridgeID: cartridgeID
			}
		);
	}
	
	function loadCartridge(cartridgeID) {
		sources.cartridge.query('ID === :1',
			{
				onSuccess: function(event) {
						if (event.dataSource.length) {
							notification.log('Cartridge scan successful');
						}
						else {
							notification.error('ERROR: cartridge not found, not registerd, or already used');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					},
				params: [cartridgeID]
			}
		);
	}
	
	function waitForScanResult(uuid) {
		sources.cartridge.wait_for_scan_result(
			{
				onSuccess: function(event) {
						$$('frameScanner').hide();
						if (event.result.success) {
							loadCartridge(event.result.cartridgeID);
						}
						else {
							notification.error('ERROR: ' + event.result.message + ' - cartridge scan not successful');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					}
			},
			{
				uuid: uuid
			}
		);
	}
	
	function scanCartridge() {
		sources.cartridge.start_scan(
			{
				onSuccess: function(event) {
						if (event.result.success) {
							notification.log('Opening scanner');
							var scanURI = 'zxing://scan/?ret=http://172.16.121.20:8081/return_cartridgeID/' + event.result.uuid + escape('?val={CODE}');
							$$('frameScanner').setValue(scanURI);
							$$('frameScanner').show();
							waitForScanResult(event.result.uuid);
						}
						else {
							notification.error('ERROR: ' + event.result.message + ' - scan not started');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					}
			}
		);
	}
	
// eventHandlers// @lock

	icon2.click = function icon2_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(1);
	};// @lock

	buttonReadyToTest.click = function buttonReadyToTest_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(3);
	};// @lock

	buttonTestResults.click = function buttonTestResults_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(5);
	};// @lock

	button1.click = function button1_click (event)// @startlock
	{// @endlock
		if (sources.device.ID) {
			callSpark(this, 'initialize_device', [sources.device.sparkCoreID], function(evt) {
					notification.log('Device initialization started');
				}
			);
		}
	};// @lock

	buttonScanCartridge.click = function buttonScanCartridge_click (event)// @startlock
	{// @endlock
		scanCartridge();
	};// @lock

	container1.click = function container1_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(6);
	};// @lock

	icon1.click = function icon1_click (event)// @startlock
	{// @endlock
		sources.device.serverRefresh({forceReload: true});
	};// @lock

	buttonStartTest.click = function buttonStartTest_click (event)// @startlock
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
								startTestMonitor(evt.result.testID, cartridgeID);
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
					cartridgeID: sources.cartridge.ID
				}
			);
		}
		else {
			notification.error('You must be signed in to run a test');	
		}
	};// @lock

	buttonMonitorTest.click = function buttonMonitorTest_click (event)// @startlock
	{// @endlock
		sources.testInProgress.query('startedOn !== null AND finishedOn === null',
			{
				onSuccess: function(evt) {
						if (evt.dataSource.length) {
							console.log('query testInProgress');
						}
						else {
							notification.log('No tests currently in progress');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					}
			}
		);
		$$('navigationView1').goToView(4);
	};// @lock

	buttonRun.click = function buttonRun_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(2);
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("icon2", "click", icon2.click, "WAF");
	WAF.addListener("buttonReadyToTest", "click", buttonReadyToTest.click, "WAF");
	WAF.addListener("buttonTestResults", "click", buttonTestResults.click, "WAF");
	WAF.addListener("button1", "click", button1.click, "WAF");
	WAF.addListener("buttonScanCartridge", "click", buttonScanCartridge.click, "WAF");
	WAF.addListener("container1", "click", container1.click, "WAF");
	WAF.addListener("icon1", "click", icon1.click, "WAF");
	WAF.addListener("buttonStartTest", "click", buttonStartTest.click, "WAF");
	WAF.addListener("buttonMonitorTest", "click", buttonMonitorTest.click, "WAF");
	WAF.addListener("buttonRun", "click", buttonRun.click, "WAF");
// @endregion
};// @endlock
