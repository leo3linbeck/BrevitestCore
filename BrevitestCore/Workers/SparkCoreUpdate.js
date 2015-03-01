﻿var spark = require('sparkCore');var updateCount = 0;var updateStatusInterval;             function updateOneCore(core) {	var a, d, s, t;	if (core.connected) {		s = spark.get_status(core.id);		if (s.success) {			d = ds.Device.find('sparkCoreID === :1', core.id);			if (d) {				d.online = core.connected;				d.status = s.success ? s.value : 'Status unavailable';				d.sparkName = core.name;				d.sparkLastHeard = core.last_heard;				d.save();			}		}				a = spark.assay_running(core.id);		if (a.success) {			t = ds.Test.find('startedOn !== null AND finishedOn === null AND ID === :1', a.value);			if (t) {				t.status = s.success ? s.value : 'Status unavailable';			}		}	}	else {		d = ds.Device.find('sparkCoreID === :1', core.id);		if (d) {			d.online = false;			d.status = 'Status unavailable';			d.save();		}	}}function doUpdateStatus(){	updateCount += 1;	var datetime = new Date();	console.log('Update ' + updateCount + ': ' + datetime.toString());		var result = spark.get_list_of_cores();		console.log('get_list_of_cores: ' + result);	if (result.success) {		result.response.forEach(updateOneCore);	}	else {		console.log(updateCount + ': Spark API not available on ' + dt.toString());	}} onconnect = function(msg){    var thePort = msg.ports[0];        console.log('In onconnect');        thePort.postMessage("OK");}console.log('Start of updating...');              doUpdateStatus();  //  Initial update so that there is not a delay at server startup timeupdateStatusInterval = setInterval(doUpdateStatus, 10000); //  Perform update every 2 minutes