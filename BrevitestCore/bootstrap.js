﻿//addHttpRequestHandler('^/close-device[?]*', getFolder().path + 'Javascript/deviceRequestHandler.js', 'closeDeviceHandler');//addHttpRequestHandler('^/open-device[?]*', getFolder().path + 'Javascript/deviceRequestHandler.js', 'openDeviceHandler');//httpServer.addWebSocketHandler("/websocket", "Javascript/websocket.js", "brevitest-websocket", true); //var sparkWorker = new SharedWorker("Workers/SparkCoreUpdate.js", "SparkCoreUpdateThread");    function doSparkUpdateSharedWorker(){    var theWorker = new SharedWorker("Workers/SparkCoreUpdate.js", "SparkCoreUpdateThread");    var thePort = theWorker.port; // MessagePort    thePort.onmessage = function(evt)    {        var message = evt.data;        switch(message.type)            {                case 'error':                    debugger;                    break;            }      }     wait(); //waits for new messages in onmessage}doSparkUpdateSharedWorker();