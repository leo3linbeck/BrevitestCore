
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var testEvent = {};	// @dataSource
	var loginHome = {};	// @login
	var deviceStatusEvent = {};	// @dataSource
	var documentEvent = {};	// @document
	var buttonCancelTest = {};	// @button
	var buttonRunTest = {};	// @button
	var buttonInitDevice = {};	// @button
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
	
	function updateGraph() {
		notification.log('Switching tests');
	}

// eventHandlers// @lock

	testEvent.onCurrentElementChange = function testEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		updateGraph();
	};// @lock

	loginHome.logout = function loginHome_logout (event)// @startlock
	{// @endlock
		$$('containerTestActions').hide();
		$$('containerTestResults').hide();
	};// @lock

	loginHome.login = function loginHome_login (event)// @startlock
	{// @endlock
		$$('containerTestActions').show();
		$$('containerTestResults').show();
	};// @lock

	deviceStatusEvent.onAttributeChange = function deviceStatusEvent_onAttributeChange (event)// @startlock
	{// @endlock
		if (event.dataSource.value === 'Assay complete.') {
			
		}
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		if (WAF.directory.currentUser().userName) {
			$$('containerTestActions').show();
			$$('containerTestResults').show();
		}
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

// @region eventManager// @startlock
	WAF.addListener("test", "onCurrentElementChange", testEvent.onCurrentElementChange, "WAF");
	WAF.addListener("loginHome", "logout", loginHome.logout, "WAF");
	WAF.addListener("loginHome", "login", loginHome.login, "WAF");
	WAF.addListener("deviceStatus", "onAttributeChange", deviceStatusEvent.onAttributeChange, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("buttonCancelTest", "click", buttonCancelTest.click, "WAF");
	WAF.addListener("buttonRunTest", "click", buttonRunTest.click, "WAF");
	WAF.addListener("buttonInitDevice", "click", buttonInitDevice.click, "WAF");
// @endregion
};// @endlock
