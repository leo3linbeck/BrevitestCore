
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var login1 = {};	// @login
	var row2 = {};	// @container
	var row1 = {};	// @container
	var testTodayEvent = {};	// @dataSource
	var icon4 = {};	// @icon
	var buttonReadyToTest = {};	// @button
	var buttonTestResults = {};	// @button
	var button1 = {};	// @button
	var buttonScanCartridge = {};	// @button
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

	var refreshInterval;
		
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
						loadRecentTests();
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
							if (event.dataSource.registeredOn === null) {
								notification.error('ERROR: cartridge not registered');
							}
							else {
								if (event.dataSource.startedOn === null) {
									notification.log('Cartridge scan successful');
								}
								else {
									notification.error('ERROR: cartridge already used');
								}
							}
						}
						else {
							notification.error('ERROR: cartridge not found');
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
							$$('frameScanner').setValue(event.result.url);
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
	
	function loadRecentTests(notifyUser) {
		var endDate = new Date();
		var startDate = endDate - (24 * 60 * 60);
		sources.testToday.query('startedOn > :1 AND startedOn < :2',
			{
				onSuccess: function(evt) {
						if (evt.dataSource.length) {
							if (notifyUser) {
								notification.log('Tests for past 24 hours updated');
							}
						}
						else {
							notification.log('No tests currently in progress');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					},
				params: [startDate, endDate],
				orderBy: 'startedOn desc'
			}
		);	
	}
	
	function loadOnlineDevices() {
		sources.device.query('registeredOn !== null AND online === true',
			{
				onSuccess: function(evt) {
						if (evt.dataSource.length === 0) {
							notification.log('No devices currently online');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					},
				orderBy: 'name'
			}
		);	
	}

	
// eventHandlers// @lock

	login1.login = function login1_login (event)// @startlock
	{// @endlock
		sources.user.start_daemons(
			{
				onSuccess: function(evt) {
					console.log(evt);
				},
				onError: function(err) {
					console.log(err);
				}
			}
		);
	};// @lock

	row2.click = function row2_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(7);
	};// @lock

	row1.click = function row1_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(6);
	};// @lock

	testTodayEvent.onCurrentElementChange = function testTodayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.ID) {
			$$('progressBarTest').setValue(event.dataSource.percentComplete, 100, 'Test started at ' + event.dataSource.startedOn.toLocaleTimeString() + ': ' + event.dataSource.percentComplete + '% complete');
			if (event.dataSource.status === 'In progress') {
				if (!refreshInterval) {
					refreshInterval = setInterval(loadRecentTests, 20000);
				}
			}
			else {
				if (refreshInterval) {
					clearInterval(refreshInterval);
					refreshInterval = null;
				}
			}
		}
		else {
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
		}
		$$('icon4')[event.dataSource.status === 'In progress' ? 'enable' : 'disable']();
	};// @lock

	icon4.click = function icon4_click (event)// @startlock
	{// @endlock
		if (window.confirm('Are you sure you want to cancel this test? The cartridge cannot be reused.')) {
			spinner.spin(this.domNode);
			sources.test.cancel(
				{
					onSuccess: function(evt) {
							spinner.stop();
							if (evt.result.success) {
								notification.log('Test cancelled');
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
					testID: sources.testToday.ID
				}
			);
		}
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

	icon1.click = function icon1_click (event)// @startlock
	{// @endlock
		loadOnlineDevices();
	};// @lock

	buttonStartTest.click = function buttonStartTest_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			notification.log('Sending test instructions to device "' + sources.device.name + '" – please stand by...');
			spinner.spin(this.domNode);
			sources.test.start(
				{
					onSuccess: function(evt) {
							spinner.stop();
							if (evt.result.success) {
								notification.log('Test started');
								startTestMonitor(evt.result.testID, sources.cartridge.ID);
								sources.cartridge.query('ID === null', {onSuccess:function(){return;}});
								if (!refreshInterval) {
									refreshInterval = setInterval(loadRecentTests, 20000);
								}
								$$('navigationView1').goToView(4);
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
		$$('navigationView1').goToView(4);
		loadRecentTests(false);
	};// @lock

	buttonRun.click = function buttonRun_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(2);
		loadOnlineDevices();
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("login1", "login", login1.login, "WAF");
	WAF.addListener("row2", "click", row2.click, "WAF");
	WAF.addListener("row1", "click", row1.click, "WAF");
	WAF.addListener("testToday", "onCurrentElementChange", testTodayEvent.onCurrentElementChange, "WAF");
	WAF.addListener("icon4", "click", icon4.click, "WAF");
	WAF.addListener("buttonReadyToTest", "click", buttonReadyToTest.click, "WAF");
	WAF.addListener("buttonTestResults", "click", buttonTestResults.click, "WAF");
	WAF.addListener("button1", "click", button1.click, "WAF");
	WAF.addListener("buttonScanCartridge", "click", buttonScanCartridge.click, "WAF");
	WAF.addListener("icon1", "click", icon1.click, "WAF");
	WAF.addListener("buttonStartTest", "click", buttonStartTest.click, "WAF");
	WAF.addListener("buttonMonitorTest", "click", buttonMonitorTest.click, "WAF");
	WAF.addListener("buttonRun", "click", buttonRun.click, "WAF");
// @endregion
};// @endlock
