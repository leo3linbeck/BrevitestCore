
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var testEvent = {};	// @dataSource
	var loginHome = {};	// @login
	var cartridgeRawEvent = {};	// @dataSource
	var buttonRegisterCartridge = {};	// @button
	var iconUpdate = {};	// @icon
	var brevicodeEvent = {};	// @dataSource
	var monitorStatusEvent = {};	// @dataSource
	var buttonCheckCalibration = {};	// @button
	var assayDataEvent = {};	// @dataSource
	var menuItemData = {};	// @menuItem
	var assayTestEvent = {};	// @dataSource
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
	var buttonDeviceRevertChanges = {};	// @button
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
	var buttonAssayRevertChanges = {};	// @button
	var buttonCreateAssay = {};	// @button
	var menuItemDevice = {};	// @menuItem
	var buttonChangeParameter = {};	// @button
	var buttonLoadParams = {};	// @button
	var buttonResetParams = {};	// @button
	var buttonRefreshDevices = {};	// @button
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
	notification.info = humane.spawn({ addnCls: 'humane-libnotify-info', timeout: 1000 });
	
	var statusMonitorID = null;
	var firmwareVersion = 8;
	var sparkCoreList = [];
	
	var clipboard = '';
	
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
						console.log('Websocket error', packet.message);
						break;
					case 'done':
						spinner.stop();
						notification.log(packet.message);
						console.log('Websocket done', packet);
						break;
					case 'data':
						websocketUpdateData(packet.name, packet.data, packet.dataSources);
						console.log('Websocket data', packet);
						break;
					case 'refresh':
						updateDatasources(packet.datastores);
						console.log('Update datasources');
						break;
					case 'percent_complete':
						$$('progressBarTest').setValue(packet.data.percent_complete, 100, 'Test started at ' + (new Date(packet.data.startedOn)).toLocaleTimeString() + ': ' + packet.data.percent_complete + '% complete');
						break;
					case 'reload_cartridges':
						testCartridge = sources.cartridgeRegistered.ID;
						sources.testCartridge.sync();
						loadCartridgesByAssay(sources.assayTest.ID, null, sources.cartridgeRegistered);
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
		if (assayID && raw) {
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
		
		if (assayID && registered) {
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

	function loadCompletedTestsByAssay(assayID, dataSource) {
		dataSource.query('finishedOn != null AND assay.ID === :1',
				{
					onSuccess: function(evt) {
						return;
					},
					onError: function(err) {
						notification.error('ERROR: ' + err.error[0].message);
					},
					params: [assayID],
					orderBy: 'finishedOn desc'
				}
		);
	}
	
	function saveDevice(callback) {
		var r = validateSerialNumber(sources.device.serialNumber);
		if (r.valid) {
			sources.device.deviceModel.set(sources.deviceModel);
			sources.device.save(
				{
					onSuccess: function(event) {
							notification.log('Device saved');
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
	
	function registerDevice(that) {
		if (sources.device.online) {
			if (sources.device.registeredOn) {
				notification.error('This device is already registered');
			}
			else {
				var user = WAF.directory.currentUser();
				
				if (user) {
					sendWebsocketMessage(that, { type: 'run',  func: 'register_device', deviceID: sources.device.ID, dataSources: [], param: {
							username: user.userName,
							deviceID: sources.device.ID,
							sparkCoreID: sources.device.sparkCoreID,
							serialNumber: sources.device.serialNumber
						 } 
					});
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
	
	function updateBCODEDuration(BCODE) {
		var str = BCODE ? BCODE : convertCommandsToAttribute();
		spark.get_BCODE_durationAsync({
			'onSuccess': function(event) {
				estimatedDuration = event;
				sources.estimatedDuration.sync();
			},
			'params': [str]
		});
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

	function connectToTestInProgress() {
		if (WAF.directory.currentUser()) {
			connectToWebsocket({ type: 'reconnect', deviceID: sources.device.ID });
			sources.device.test_in_progress(
				{
					onSuccess: function(event) {
						testCartridge = event.result;
						sources.testCartridge.sync();
					},
					onError: function(error) {
						testCartridge = '';
						sources.testCartridge.sync();
						console.log('SYSTEM ERROR: Retrieving test in progress, ' + error.error[0].message);
					}
				},
				{
					deviceID: sources.device.ID
				}
			);
		}
	}
//
//
//
//
// eventHandlers// @lock

	testEvent.onCurrentElementChange = function testEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		var v = sources.test.outcome;
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
		loadGraph(sources.test.ID);
	};// @lock

	loginHome.login = function loginHome_login (event)// @startlock
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

	cartridgeRawEvent.onCurrentElementChange = function cartridgeRawEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		$$('qrRawCartridge').width(120);
		$$('qrRawCartridge').height(120);
	};// @lock

	buttonRegisterCartridge.click = function buttonRegisterCartridge_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		if (user) {
			sources.cartridgeRaw.register(
				{
					onSuccess: function(evt) {
							if (evt.result) {
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

	iconUpdate.click = function iconUpdate_click (event)// @startlock
	{// @endlock
		brevicode[sources.brevicode.getPosition()] = getCommandObject();
		sources.brevicode.sync();
		updateBCODEDuration();
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

	buttonCheckCalibration.click = function buttonCheckCalibration_click (event)// @startlock
	{// @endlock
		if (sources.device.online) {
			var user = WAF.directory.currentUser();
			
			if (user) {
				sendWebsocketMessage(this, { 
					type: 'run',  
					func: 'check_device_calibration', 
					deviceID: sources.device.ID, 
					dataSources: [], 
					param: {
						username: user.userName,
						deviceID: sources.device.ID
					} 
				});
			}
			else {
				notification.error('You must be signed in to calibrate a device');
			}
		}
		else {
			notification.error('Device must be online to calibrate');
		}

	};// @lock

	assayDataEvent.onCurrentElementChange = function assayDataEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadCompletedTestsByAssay(event.dataSource.ID, sources.test);
	};// @lock

	menuItemData.click = function menuItemData_click (event)// @startlock
	{// @endlock
		sources.assayData.all({ onSuccess: function(evt) {return;} });
	};// @lock

	assayTestEvent.onCurrentElementChange = function assayTestEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		loadCartridgesByAssay(event.dataSource.ID, null, sources.cartridgeRegistered);
	};// @lock

	buttonCancelTest.click = function buttonCancelTest_click (event)// @startlock
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
						cartridgeID: testCartridge 
					} 
				});
				}
			else {
				notification.error('You must be signed in to cancel a test');	
			}
		}
	};// @lock

	buttonRunTest.click = function buttonRunTest_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			if (sources.cartridgeRegistered.ID) {
				sendWebsocketMessage(this, { 
					type: 'run', 
					func: 'run_test', 
					deviceID: sources.device.ID, 
					dataSources: [], 
					param: { 
						username: user.userName, 
						deviceID: sources.device.ID, 
						cartridgeID: sources.cartridgeRegistered.ID 
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

	buttonInitDevice.click = function buttonInitDevice_click (event)// @startlock
	{// @endlock
		var user = WAF.directory.currentUser();
		
		if (user) {
			testCartridge = '';
			sources.testCartridge.sync();
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

	deviceEvent.onCurrentElementChange = function deviceEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		if (event.dataSource.ID) {
			if (event.dataSource.sparkCoreID) {
				if (event.dataSource.online) {
					deviceOnline = 'YES - ONLINE' ;
					sources.deviceOnline.sync();
					$$('textFieldDeviceOnline').setBackgroundColor('green');
					$$('containerTestActions').show();
					connectToTestInProgress();
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
			
			sources.deviceModel.selectByKey(event.dataSource.deviceModel.getKey(), { onSuccess: function(e) {return;} });
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
									notification.log(evt.result + ' cartridges made - you must register those you wish to test');
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
		sources.device.deviceModel.set(event.dataSource);
		sources.device.serverRefresh({ onSuccess: function() {return;} });
	};// @lock

	buttonCreateNewDevice.click = function buttonCreateNewDevice_click (event)// @startlock
	{// @endlock
		sources.device.addNewElement();
	};// @lock

	buttonSaveDevice.click = function buttonSaveDevice_click (event)// @startlock
	{// @endlock
		saveDevice();
	};// @lock

	buttonDeviceRevertChanges.click = function buttonDeviceRevertChanges_click (event)// @startlock
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

	buttonPasteBCODE.click = function buttonPasteBCODE_click (event)// @startlock
	{// @endlock
		brevicode = convertAttributeToCommands(clipboard);
		sources.brevicode.sync();
		updateBCODEDuration();
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
		updateBCODEDuration(event.dataSource.BCODE);
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		sources.deviceModel.all({ onSuccess: function() {return;} });
		
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
		sources.brevicode.sync();
		updateBCODEDuration();
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
			updateBCODEDuration();
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
			updateBCODEDuration();
		}
	};// @lock

	buttonMoveToBottom.click = function buttonMoveToBottom_click (event)// @startlock
	{// @endlock
		brevicode.push(brevicode.splice(sources.brevicode.getPosition(), 1)[0]);
		sources.brevicode.select(brevicode.length - 1);
		sources.brevicode.sync();
		updateBCODEDuration();
	};// @lock

	buttonMoveToTop.click = function buttonMoveToTop_click (event)// @startlock
	{// @endlock
		brevicode.splice(0, 0, brevicode.splice(sources.brevicode.getPosition(), 1)[0]);
		sources.brevicode.select(0);
		sources.brevicode.sync();
		updateBCODEDuration();
	};// @lock

	buttonInsertBelow.click = function buttonInsertBelow_click (event)// @startlock
	{// @endlock
		var pos = sources.brevicode.getPosition() + 1;
		brevicode.splice(pos, 0, getCommandObject());
		sources.brevicode.select(pos);
		sources.brevicode.sync();
		updateBCODEDuration();
	};// @lock

	buttonInsertAbove.click = function buttonInsertAbove_click (event)// @startlock
	{// @endlock

		var pos = sources.brevicode.getPosition();
		pos = (pos < 0 ? 0 : pos);
		brevicode.splice(pos, 0, getCommandObject());
		sources.brevicode.select(pos);
		sources.brevicode.sync();
		updateBCODEDuration();
	};// @lock

	buttonAppendEnd.click = function buttonAppendEnd_click (event)// @startlock
	{// @endlock
		brevicode.push(getCommandObject());
		sources.brevicode.select(brevicode.length - 1);
		sources.brevicode.sync();
		updateBCODEDuration();
	};// @lock

	buttonInsertTop.click = function buttonInsertTop_click (event)// @startlock
	{// @endlock
		brevicode.splice(0, 0, getCommandObject());
		sources.brevicode.select(0);
		sources.brevicode.sync();
		updateBCODEDuration();
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
						updateBCODEDuration(sources.assay.BCODE);
					},
				onError: function(err) {
						notification.error('SYSTEM ERROR: ' + err.error[0].message);
					}
			}
		);
	};// @lock

	buttonAssayRevertChanges.click = function buttonAssayRevertChanges_click (event)// @startlock
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

	menuItemDevice.click = function menuItemDevice_click (event)// @startlock
	{// @endlock
		if (sources.device.length === 0) {
			sources.device.all({
				onSuccess: function(evt) {
					sources.deviceModel.selectByKey(evt.dataSource.deviceModel.getKey(), { onSuccess: function(e) {return;} });
				} 
			});
		}
		

	};// @lock

	buttonChangeParameter.click = function buttonChangeParameter_click (event)// @startlock
	{// @endlock
		if (sources.device.online) {
			sendWebsocketMessage(this, { 
				type: 'run', 
				func: 'change_parameter', 
				deviceID: sources.device.ID, 
				dataSources: [], 
				param: {
					name: sources.sparkAttr.name, 
					value: sources.sparkAttr.value
				} 
			});
		}
		else {
			notification.error('Device "' + sources.device.name + '" is not online');
		}
	};// @lock

	buttonLoadParams.click = function buttonLoadParams_click (event)// @startlock
	{// @endlock
		if (sources.device.online) {
			sendWebsocketMessage(this, { 
				type: 'run', 
				func: 'load_parameters', 
				deviceID: sources.device.ID, 
				dataSources: [] 
			});
		}
		else {
			notification.error('Device "' + sources.device.name + '" is not online');
		}
	};// @lock

	buttonResetParams.click = function buttonResetParams_click (event)// @startlock
	{// @endlock
		if (sources.device.online) {
			sendWebsocketMessage(this, { 
				type: 'run', 
				func: 'reset_parameters', 
				deviceID: sources.device.ID, 
				dataSources: []
			});
		}
		else {
			notification.error('Device "' + sources.device.name + '" is not online');
		}
	};// @lock

	buttonRefreshDevices.click = function buttonRefreshDevices_click (event)// @startlock
	{// @endlock
		sendWebsocketMessage(this, { type: 'update_devices' });
	};// @lock

	buttonSensorData.click = function buttonSensorData_click (event)// @startlock
	{// @endlock
		sendWebsocketMessage(this, { type: 'run',  func: 'get_sensor_data', deviceID: sources.device.ID, dataSources: ['sensorData'] });
	};// @lock

	buttonRegisterDevice.click = function buttonRegisterDevice_click (event)// @startlock
	{// @endlock
		registerDevice(this);
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("test", "onCurrentElementChange", testEvent.onCurrentElementChange, "WAF");
	WAF.addListener("loginHome", "login", loginHome.login, "WAF");
	WAF.addListener("cartridgeRaw", "onCurrentElementChange", cartridgeRawEvent.onCurrentElementChange, "WAF");
	WAF.addListener("buttonRegisterCartridge", "click", buttonRegisterCartridge.click, "WAF");
	WAF.addListener("iconUpdate", "click", iconUpdate.click, "WAF");
	WAF.addListener("brevicode", "onCurrentElementChange", brevicodeEvent.onCurrentElementChange, "WAF");
	WAF.addListener("monitorStatus", "onAttributeChange", monitorStatusEvent.onAttributeChange, "WAF");
	WAF.addListener("buttonCheckCalibration", "click", buttonCheckCalibration.click, "WAF");
	WAF.addListener("assayData", "onCurrentElementChange", assayDataEvent.onCurrentElementChange, "WAF");
	WAF.addListener("menuItemData", "click", menuItemData.click, "WAF");
	WAF.addListener("assayTest", "onCurrentElementChange", assayTestEvent.onCurrentElementChange, "WAF");
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
	WAF.addListener("buttonDeviceRevertChanges", "click", buttonDeviceRevertChanges.click, "WAF");
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
	WAF.addListener("buttonAssayRevertChanges", "click", buttonAssayRevertChanges.click, "WAF");
	WAF.addListener("buttonCreateAssay", "click", buttonCreateAssay.click, "WAF");
	WAF.addListener("menuItemDevice", "click", menuItemDevice.click, "WAF");
	WAF.addListener("buttonChangeParameter", "click", buttonChangeParameter.click, "WAF");
	WAF.addListener("buttonLoadParams", "click", buttonLoadParams.click, "WAF");
	WAF.addListener("buttonResetParams", "click", buttonResetParams.click, "WAF");
	WAF.addListener("buttonRefreshDevices", "click", buttonRefreshDevices.click, "WAF");
	WAF.addListener("buttonSensorData", "click", buttonSensorData.click, "WAF");
	WAF.addListener("buttonRegisterDevice", "click", buttonRegisterDevice.click, "WAF");
// @endregion
};// @endlock
