
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

	var userLoggedIn;
	
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

	function createOneGraph(objArray, sensorChar, leftHandGraph) {
		var h, i, m, offset, w, x, y;
		var clear = [];
		var red = [];
		var green = [];
		var blue = [];
		var margin = 20;
		
		for (i = 0; i < objArray.length; i += 1) {
			if (objArray[i].sensor === sensorChar) {
				clear.push(objArray[i].clear);
				red.push(objArray[i].red);
				green.push(objArray[i].green);
				blue.push(objArray[i].blue);
			}
		}
		
		m = Math.max(d3.max(clear), d3.max(red), d3.max(green), d3.max(blue));
		w = $$('containerGraph').getWidth()/2 - 4 * margin;
		h = $$('containerGraph').getHeight() - 2 * margin;
		offset = leftHandGraph ? 0 : $$('containerGraph').getWidth() + 2 * margin;
		y = d3.scale.linear().domain([0, m]).range([0 + margin, h - margin]);
		x = d3.scale.linear().domain([0, clear.length]).range([offset + margin, offset + w - margin]);
			
		var vis = d3.select("#containerGraph")
			.append("svg:svg")
			.attr("width", w)
			.attr("height", h);
		 
		var g = vis.append("svg:g")
			.attr("transform", 'translate(' + margin + ', ' + h + ')');

		var line = d3.svg.line()
			.x(function(d,i) { return x(i); })
			.y(function(d) { return -1 * y(d); });

		g.append("svg:path")
			.attr("d", line(clear))
			.style('fill', 'none')
			.style('stroke', 'gray')
			.style('stroke-width', 2);
			
		g.append("svg:path")
			.attr("d", line(red))
			.style('fill', 'none')
			.style('stroke', 'red')
			.style('stroke-width', 2);
			
		g.append("svg:path")
			.attr("d", line(green))
			.style('fill', 'none')
			.style('stroke', 'green')
			.style('stroke-width', 2);
			
		g.append("svg:path")
			.attr("d", line(blue))
			.style('fill', 'none')
			.style('stroke', 'blue')
			.style('stroke-width', 2);
			
		g.append("svg:line")
			.style('stroke', 'black')
			.attr("x1", x(0))
			.attr("y1", -1 * y(0))
			.attr("x2", x(w))
			.attr("y2", -1 * y(0));
 
		g.append("svg:line")
			.style('stroke', 'black')
			.attr("x1", x(0))
			.attr("y1", -1 * y(0))
			.attr("x2", x(0))
			.attr("y2", -1 * y(m));

		g.selectAll(".xLabel")
			.enter().append("svg:text")
				.style('font-family', 'Arial')
				.style('font-size', '9pt')
				.attr("class", "xLabel")
				.text(String)
				.attr("x", function(d) { return x(d) })
				.attr("y", 0)
				.attr("text-anchor", "middle");
 
		g.selectAll(".yLabel")
			.enter().append("svg:text")
				.style('font-family', 'Arial')
				.style('font-size', '9pt')
				.attr("class", "yLabel")
				.text(String)
				.attr("x", 0)
				.attr("y", function(d) { return -1 * y(d) })
				.attr("text-anchor", "right")
				.attr("dy", 4);

		g.selectAll(".xTicks")
			.clear(x.ticks(5))
			.enter().append("svg:line")
				.style('stroke', 'black')
				.attr("class", "xTicks")
				.attr("x1", function(d) { return x(d); })
				.attr("y1", -1 * y(0))
				.attr("x2", function(d) { return x(d); })
				.attr("y2", -1 * y(-0.2));
 
		g.selectAll(".yTicks")
			.clear(y.ticks(4))
			.enter().append("svg:line")
				.style('stroke', 'black')
				.attr("class", "yTicks")
				.attr("y1", function(d) { return -1 * y(d); })
				.attr("x1", x(-0.1))
				.attr("y2", function(d) { return -1 * y(d); })
				.attr("x2", x(0));

	}
	
	function updateGraph(objArray) {
		createOneGraph(objArray, 'A', true);
		createOneGraph(objArray, 'C', false);
	}


// eventHandlers// @lock

	testEvent.onCurrentElementChange = function testEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		sources.test.get_raw_sensor_readings(
			{
				onSuccess: function(evt) {
					updateGraph(evt.result);
				},
				onError: function(err) {
					notification.error('SYSTEM ERROR: ' + err.error[0].message);
				}
			},
			{
				testID: event.dataSource.ID
			}
		);
	};// @lock

	loginHome.logout = function loginHome_logout (event)// @startlock
	{// @endlock
		$$('containerTestActions').hide();
		$$('containerTestResults').hide();
		userLoggedIn.clear();
	};// @lock

	loginHome.login = function loginHome_login (event)// @startlock
	{// @endlock
		$$('containerTestActions').show();
		$$('containerTestResults').show();
		userLoggedIn = new localStorage;
	};// @lock

	deviceStatusEvent.onAttributeChange = function deviceStatusEvent_onAttributeChange (event)// @startlock
	{// @endlock
		if (event.dataSource.value === 'Assay complete.') {
			
		}
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		if (userLoggedIn) {
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
								startTestMonitor(evt.result.testID, cartridgeID);
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
					cartridgeID: cartridgeID
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
