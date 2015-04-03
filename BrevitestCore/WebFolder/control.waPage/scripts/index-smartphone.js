
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var richText4 = {};	// @richText
	var select1 = {};	// @select
	var select2 = {};	// @select
	var select3 = {};	// @select
	var row2 = {};	// @container
	var row1 = {};	// @container
	var testTodayEvent = {};	// @dataSource
	var icon4 = {};	// @icon
	var buttonReadyToTest = {};	// @button
	var buttonTestResults = {};	// @button
	var buttonPrepareDevice = {};	// @button
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
	notification.info = humane.spawn({ addnCls: 'humane-libnotify-info', clickToClose: true, timeout: 3000 });
	
	function notifyStacked(message) {
		notification.info(message);
	}
	
	var firmwareVersion = 9;
	
	var websocketConnections = {};
	var websocket;
	
	function getWebsocketAddress() {
		var baseURL = WAF.config.baseURL;
		var ws = baseURL.replace('http', 'ws');
		return ws.replace('waLib/WAF', 'websocket');
	}
	
	function websocketUpdateData(name, data, dataSources) {
		switch (name) {
			case 'device_parameters':
				sparkAttr = data;
				sources.sparkAttr.sync();
				break;
		}
	
		for (var i = 0; i < dataSources.length; i += 1) {
			if (typeof sources[dataSources[i]].sync === 'undefined') { // server datasource
				sources[dataSources[i]].collectionRefresh({ onSuccess: function(e) {return;} });
			}
		}
	}
	
	function updateDatasources(datastores) {
		var d, i, k;
		
		k = Object.keys(sources);
		for (i = 0; i < k.length; i += 1) {
			d = sources[k[i]];
			if (typeof d.sync() === 'undefined' && datastores.indexOf(d.getClassTitle()) !== -1) {
				d.collectionRefresh({ onSuccess: function(e) {return;} });
			}
		}
	}
	
	function connectToWebsocket(param) {
		if (!websocketConnections[param.deviceID]) {
			websocket = new WebSocket(getWebsocketAddress());
			websocket.onmessage = function websocketonmessagehandler(message) {
				var packet = JSON.parse(message.data);
				switch (packet.type) {
					case 'connected':
						websocketConnections[param.deviceID] = true;
						websocket.send(JSON.stringify(param));
						console.log('Websocket connected', param.deviceID);
						break;
					case 'message':
						notification.info(packet.message);
						console.log('Websocket message', packet);
						break;
					case 'error':
						spinner.stop();
						notification.error(packet.message.message);
						console.log('Websocket error', packet);
						break;
					case 'done':
						spinner.stop();
						notification.log(packet.message);
						console.log('Websocket done', packet);
						break;
					case 'data':
						websocketUpdateData(packet.name, packet.data, packet.data.datastores);
						console.log('Websocket data', packet);
						break;
					case 'refresh':
						updateDatasources(packet.data.datastores);
						console.log('Update datasources');
						break;
					case 'percent_complete':
						$$('progressBarTest').setValue(packet.data.percent_complete, 100, 'Test started at ' + (new Date(packet.data.startedOn)).toLocaleTimeString() + ': ' + packet.data.percent_complete + '% complete');
						break;
					case 'reload_cartridges':
						break;
				}
			};
			websocket.onclose = function websocketonclosehandler() {
				console.log('Websocket disconnecting');
				delete websocketConnections[param.deviceID];
			};
		}
	}
	
	function sendWebsocketMessage(that, param, callback) {
		if (that) {
			spinner.spin(that.domNode);
		}
		
		if (param && param.deviceID && websocketConnections[param.deviceID]) {
			websocket.send(JSON.stringify(param));
		}
		else {
			connectToWebsocket(param);
		}
		
		if (callback) {
			callback();
		}
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
	
	function loadTestFinished(changed) {
		var testsByResult, testsByStatus, testsByDate;
		
		sources.testFinished.query('startedOn !== null',
			{
				onSuccess: function(event) {
					
				},
				onError: function(error) {
					
				},
				params: [],
				orderBy: 'startedOn desc'
			}
		);
	}
		
	var bounds, svg;
	
	function updateBounds(x, y) {
		bounds.xmin = bounds.xmin > x ? x : bounds.xmin;
		bounds.ymin = bounds.ymin > y ? y : bounds.ymin;
		bounds.xmax = bounds.xmax < x ? x : bounds.xmax;
		bounds.ymax = bounds.ymax < y ? y : bounds.ymax;
			
		return {x: x, y: y};
	}
	
	var firstGraph = true;
	
	function generateGraph(rawData) {
		var data = [];
		var clear = [];
		var red = [];
		var green = [];
		var blue = [];
		var r_minus_b = [];

		bounds = {
			xmax : 0,
			xmin : 0,
			ymax : 0,
			ymin : 0
		}
	
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
		var margin = {top: 20, right: 30, bottom: 50, left: 60},
		    width = $('#containerGraph').width() - margin.left - margin.right,
		    height = $('#containerGraph').height() - margin.top - margin.bottom;
			
		var x = d3.scale.linear()
		    .domain([bounds.xmin, bounds.xmax])
		    .range([0, width]);
		 
		var y = d3.scale.linear()
		    .domain([bounds.ymin * (bounds.ymin > 0 ? 0.9 : 1.1), bounds.ymax * (bounds.ymax > 0 ? 1.1 : 0.9)])
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
			.attr("y", (-margin.left) + 15)
			.attr("x", -height/2 - 50)
			.text('Assay minus Control');	
		 
		svg.append("g")
			.attr("class", "x axis")
			.append("text")
			.attr("class", "axis-label")
			.attr("y", height + 40)
			.attr("x", width/2 - 30)
			.text('Time (secs)');	
		 
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
			.attr('stroke-width', function(d,i) {
				return i === colors.length-1 ? 5 : 1.5;
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
		sources.test.get_sensor_reading_array(
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

	richText4.click = function richText4_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(4);
		loadRecentTests(false);
	};// @lock

	select1.change = function select1_change (event)// @startlock
	{// @endlock
		loadTestFinished('date');
	};// @lock

	select2.change = function select2_change (event)// @startlock
	{// @endlock
		loadTestFinished('status');
	};// @lock

	select3.change = function select3_change (event)// @startlock
	{// @endlock
		loadTestFinished('result');
	};// @lock

	row2.click = function row2_click (event)// @startlock
	{// @endlock
		var v = sources.testFinished.outcome;
		if (v[0] === 'P') {
			$$('textFieldTestOutcome').setBackgroundColor('#FF0000');
		}
		else {
			if (v[0] === 'B') {
				$$('textFieldTestOutcome').setBackgroundColor('yellow');
			}
			else {
				$$('textFieldTestOutcome').setBackgroundColor('#00FF00');
			}
		}

		$('#containgerGraph, svg').remove();
		$$('navigationView1').goToView(7);
		loadGraph(sources.testFinished.ID);
	};// @lock

	row1.click = function row1_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(6);
	};// @lock

	testTodayEvent.onCurrentElementChange = function testTodayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		$$('progressBarTest').setValue(event.dataSource.percentComplete, 100, 'Test started at ' + (new Date(event.dataSource.startedOn)).toLocaleTimeString() + ': ' + event.dataSource.percentComplete + '% complete');
		$$('icon4')[event.dataSource.status === 'In progress' ? 'enable' : 'disable']();
	};// @lock

	icon4.click = function icon4_click (event)// @startlock
	{// @endlock
		if (confirm('Are you sure you want to cancel this test? This cannot be undone, and the cartridge will be unusable afterwards')) {
			var user = WAF.directory.currentUser();
			
			if (user) {
				sendWebsocketMessage(this, { 
					type: 'cancel',
					func: 'cancel_test',
					deviceID: sources.device.ID, 
					dataSources: [], 
					param: { 
						username: user.userName, 
						deviceID: sources.device.ID, 
						cartridgeID: sources.cartridge.ID 
					} 
				});
				}
			else {
				notification.error('You must be signed in to cancel a test');	
			}
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

	buttonPrepareDevice.click = function buttonPrepareDevice_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			$$('progressBarTest').setValue(0, 100, 'No test underway');
			sendWebsocketMessage(this, { 
				type: 'run',  
				func: 'initialize_device', 
				deviceID: sources.device.ID, 
				dataSources: [], 
				param: { 
					username: user.userName, 
					deviceID: sources.device.ID 
				} 
			});
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
			if (sources.cartridge.ID) {
				sendWebsocketMessage(this, { 
					type: 'run', 
					func: 'run_test', 
					deviceID: sources.device.ID, 
					dataSources: ['testToday', 'testFinished'], 
					param: { 
						username: user.userName, 
						deviceID: sources.device.ID, 
						cartridgeID: sources.cartridge.ID 
					} 
				});
			}
			else {
				notification.error('You must select a registered, unused cartridge');	
			}
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
	WAF.addListener("richText4", "click", richText4.click, "WAF");
	WAF.addListener("select1", "change", select1.change, "WAF");
	WAF.addListener("select2", "change", select2.change, "WAF");
	WAF.addListener("select3", "change", select3.change, "WAF");
	WAF.addListener("row2", "click", row2.click, "WAF");
	WAF.addListener("row1", "click", row1.click, "WAF");
	WAF.addListener("testToday", "onCurrentElementChange", testTodayEvent.onCurrentElementChange, "WAF");
	WAF.addListener("icon4", "click", icon4.click, "WAF");
	WAF.addListener("buttonReadyToTest", "click", buttonReadyToTest.click, "WAF");
	WAF.addListener("buttonTestResults", "click", buttonTestResults.click, "WAF");
	WAF.addListener("buttonPrepareDevice", "click", buttonPrepareDevice.click, "WAF");
	WAF.addListener("buttonScanCartridge", "click", buttonScanCartridge.click, "WAF");
	WAF.addListener("icon1", "click", icon1.click, "WAF");
	WAF.addListener("buttonStartTest", "click", buttonStartTest.click, "WAF");
	WAF.addListener("buttonMonitorTest", "click", buttonMonitorTest.click, "WAF");
	WAF.addListener("buttonRun", "click", buttonRun.click, "WAF");
// @endregion
};// @endlock
