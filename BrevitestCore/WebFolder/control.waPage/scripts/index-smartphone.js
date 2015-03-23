
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
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

	var sse_notification_on = false;
	var sse = new EventSource('/status');
	sse.onmessage = function eventsourcehandler(event) {
		var data = JSON.parse(event.data);
		var percentComplete, testID; 
		switch (data.type) {
			case 'user_message':
				notification.info(data.message);
				break;
			case 'error':
				notification.error(data.message);
				break;
			case 'percent_complete':
				testID = data.data.testID;
				percentComplete = data.data.percent_complete;
				if (sources.testToday.ID === testID) {
					sources.testToday.serverRefresh({ onSuccess: function(e) {return;}, forceReload: true });
				}
				break;
		}
	};
		
	var spinnerOpts = {
		color: '#CCC'
	};
	var spinner = new Spinner(spinnerOpts);
	
	var notification = humane.create({ timeout: 2000, baseCls: 'humane-libnotify' });
	notification.error = humane.spawn({ addnCls: 'humane-libnotify-error', clickToClose: true, timeout: 0 });
	notification.info = humane.spawn({ addnCls: 'humane-libnotify-info', clickToClose: true, timeout: 1000 });
	
	var firmwareVersion = 9;
	
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
		scanQRcode.wait_for_codeAsync(
			{
				onSuccess: function(event) {
						$$('frameScanner').hide();
						if (event.success) {
							loadCartridge(event.cartridgeID);
						}
						else {
							notification.error('ERROR: ' + event.message + ' - cartridge scan not successful');
						}
					},
				onError: function(error) {
						notification.error('SYSTEM ERROR: ' + error.error[0].message);
					}
			}, uuid
		);
	}
	
	function scanCartridge() {
		scanQRcode.start_scanAsync(
			{
				onSuccess: function(event) {
						if (event.success) {
							notification.log('Opening scanner');
							$$('frameScanner').setValue(event.url);
							$$('frameScanner').show();
							waitForScanResult(event.uuid);
						}
						else {
							notification.error('ERROR: ' + event.message + ' - scan not started');
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

	function loadTestFinished() {
		var queryString = '';
		
		switch (testResultFilter) {
			case 'all':
				break;
			case 'positive':
				break;
			case 'negative':
				break;
			case 'borderline':
				break;
		}

		switch (testStatusFilter) {
			case 'finished':
				break;
			case 'cancelled':
				break;
			case 'all':
				break;
			case 'failed':
				break;
		}

		today = new Date();
		switch (testDateFilter) {
			case 'this_week':
				break;
			case 'today':
				break;
			case 'last_week':
				break;
			case 'this_month':
				break;
			case 'this_year':
				break;
			case 'enter_date':
				break;
		}
		
		sources.testFinished.query('startedOn !== null',
			{
				onSuccess: function(event) {
					
				},
				onError: function(error) {
					
				},
				params: []
			}
		);
	}
		
	var bounds = {
		xmax : 0,
		xmin : 0,
		ymax : 0,
		ymin : 0
	}
	
	function updateBounds(x, y) {
		bounds.xmin = bounds.xmin > x ? x : bounds.xmin;
		bounds.ymin = bounds.ymin > y ? y : bounds.ymin;
		bounds.xmax = bounds.xmax < x ? x : bounds.xmax;
		bounds.ymax = bounds.ymax < y ? y : bounds.ymax;
			
		return {x: x, y: y};
	}
		
	function generateGraph(rawData) {
		var data = [];
		var clear = [];
		var red = [];
		var green = [];
		var blue = [];
		var r_minus_b = [];
		var margin = 20;
		var startTime = Date.parse(rawData[0].time);
		for (var i = 0; i < rawData.length; i += 2) {
			clear.push(updateBounds(Date.parse(rawData[i].time) - startTime, rawData[i].clear - rawData[i + 1].clear));
			red.push(updateBounds(Date.parse(rawData[i].time) - startTime, rawData[i].red - rawData[i + 1].red));
			green.push(updateBounds(Date.parse(rawData[i].time) - startTime, rawData[i].green - rawData[i + 1].green));
			blue.push(updateBounds(Date.parse(rawData[i].time) - startTime, rawData[i].blue - rawData[i + 1].blue));
			r_minus_b.push(updateBounds(Date.parse(rawData[i].time) - startTime, rawData[i].red - rawData[i + 1].red - rawData[i].blue + rawData[i + 1].blue));
		}
		data.push(clear);
		data.push(red);
		data.push(green);
		data.push(blue);
		data.push(r_minus_b);
		
		var colors = [
			'gray',
			'red',
			'green',
			'blue',
			'purple'
		]
		 
		 
		//************************************************************
		// Create Margins and Axis and hook our zoom function
		//************************************************************
		var margin = {top: 20, right: 30, bottom: 30, left: 50},
		    width = $('#containerGraph').width() - margin.left - margin.right,
		    height = $('#containerGraph').height() - margin.top - margin.bottom;
			
		var x = d3.scale.linear()
		    .domain([bounds.xmin, bounds.xmax])
		    .range([0, width]);
		 
		var y = d3.scale.linear()
		    .domain([bounds.ymin, bounds.ymax])
		    .range([height, 0]);
			
		var xAxis = d3.svg.axis()
		    .scale(x)
			.tickSize(-height)
			.tickPadding(10)	
			.tickSubdivide(true)	
		    .orient("bottom");	
			
		var yAxis = d3.svg.axis()
		    .scale(y)
			.tickPadding(10)
			.tickSize(-width)
			.tickSubdivide(true)	
		    .orient("left");
			
		var zoom = d3.behavior.zoom()
		    .x(x)
		    .y(y)
		    .scaleExtent([1, 10])
		    .on("zoom", zoomed);	
			
			
		 
			
			
		//************************************************************
		// Generate our SVG object
		//************************************************************	
		var svg = d3.select("#containerGraph").append("svg")
			.call(zoom)
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
			.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		 
		svg.append("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis);
		 
		svg.append("g")
		    .attr("class", "y axis")
		    .call(yAxis);
		 
		svg.append("g")
			.attr("class", "y axis")
			.append("text")
			.attr("class", "axis-label")
			.attr("transform", "rotate(-90)")
			.attr("y", (-margin.left) + 10)
			.attr("x", -height/2)
			.text('Axis Label');	
		 
		svg.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);
			
			
			
			
			
		//************************************************************
		// Create D3 line object and draw data on our SVG object
		//************************************************************
		var line = d3.svg.line()
		    .interpolate("linear")	
		    .x(function(d, i) { return x(d.x); })
		    .y(function(d) { return y(d.y); });		
			
		svg.selectAll('.line')
			.data(data)
			.enter()
			.append("path")
		    .attr("class", "line")
			.attr("clip-path", "url(#clip)")
			.attr('stroke', function(d,i){ 			
				return colors[i%colors.length];
			})
		    .attr("d", line);		
			
			
			
			
		//************************************************************
		// Draw points on SVG object based on the data given
		//************************************************************
		var points = svg.selectAll('.dots')
			.data(data)
			.enter()
			.append("g")
		    .attr("class", "dots")
			.attr("clip-path", "url(#clip)");	
		 
		points.selectAll('.dot')
			.data(function(d, index){ 		
				var a = [];
				d.forEach(function(point,i){
					a.push({'index': index, 'point': point});
				});		
				return a;
			})
			.enter()
			.append('circle')
			.attr('class','dot')
			.attr("r", 2.5)
			.attr('fill', function(d,i){ 	
				return colors[d.index%colors.length];
			})	
			.attr("transform", function(d) { 
				return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")"; }
			);
			
		 
			
			
			
			
		//************************************************************
		// Zoom specific updates
		//************************************************************
		function zoomed() {
			svg.select(".x.axis").call(xAxis);
			svg.select(".y.axis").call(yAxis);   
			svg.selectAll('path.line').attr('d', line);  
		 
			points.selectAll('circle').attr("transform", function(d) { 
				return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")"; }
			);  
		}

	}

	function loadGraph(testID) {
		sources.testFinished.get_sensor_reading_array(
			{
				onSuccess: function(event) {
					generateGraph(event.result);
				},
				onError: function(error) {
					notification.error('SYSTEM ERROR: Unable to load graph data, ' + error.error[0].message);
				}
			},
			{
				testID: testID
			}
		);
	}
	
// eventHandlers// @lock

	row2.click = function row2_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(7);
		loadGraph(sources.testFinished.ID);
	};// @lock

	row1.click = function row1_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(6);
	};// @lock

	testTodayEvent.onCurrentElementChange = function testTodayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.ID) {
			$$('progressBarTest').setValue(event.dataSource.percentComplete, 100, 'Test started at ' + event.dataSource.startedOn.toLocaleTimeString() + ': ' + event.dataSource.percentComplete + '% complete');
		}
		$$('icon4')[event.dataSource.status === 'In progress' ? 'enable' : 'disable']();
	};// @lock

	icon4.click = function icon4_click (event)// @startlock
	{// @endlock
			var user = WAF.directory.currentUser();
			
			if (user) {
				if (window.confirm('Are you sure you want to cancel this test? The cartridge cannot be reused.')) {
					dispatch.runOnceAsync({
						onSuccess: function(evt) {
							if (evt.result.success) {
								notification.log('Test successfully started');
								sources.cartridge.query('ID === null', {onSuccess:function(){return;}});
								$$('navigationView1').goToView(4);
							}
							else {
								notification.error('ERROR: ' + evt.result.message + ' - test not cancelled');
							}
						},
						onError: function(err) {
							notification.error('SYSTEM ERROR: Test failed to cancel');
						},
						params: [ 'cancel_test', { username: user.userName, testID: sources.testToday.ID } ]
					});
				}
			}
			else {
				notification.error('You must be signed in to cancel a test');	
			}
	};// @lock

	buttonReadyToTest.click = function buttonReadyToTest_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(3);
	};// @lock

	buttonTestResults.click = function buttonTestResults_click (event)// @startlock
	{// @endlock
		loadTestFinished();
		$$('navigationView1').goToView(5);
	};// @lock

	button1.click = function button1_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			if (sources.device.ID) {
				dispatch.runOnceAsync({
					onSuccess: function(evt) {
						notification.info('Device initialization begun');
					},
					onError: function(err) {
						notification.error('Device initialization failed');
					},
					params: [ 'initialize_device', { username: user.userName, deviceID: sources.device.ID } ]
				});
			}
			else {
				notification.error('No device selected to initialize');
			}
		}
		else {
			notification.error('You must be signed in to initialize a device');
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
			dispatch.runOnceAsync({
				onSuccess: function(evt) {
					if (evt.success) {
						sources.cartridge.query('ID === null', {onSuccess:function(){return;}});
						$$('navigationView1').goToView(1);
					}
					else {
						notification.error('ERROR: ' + evt.message + ' - test not started');
					}
				},
				onError: function(err) {
					notification.error('SYSTEM ERROR: Test failed to start');
				},
				params: [ 'run_test', { username: user.userName, deviceID: sources.device.ID, cartridgeID: sources.cartridge.ID } ]
			});
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
