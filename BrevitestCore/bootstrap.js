﻿addHttpRequestHandler('^/close-device[?]*', getFolder().path + 'Javascript/deviceRequestHandler.js', 'closeDeviceHandler');addHttpRequestHandler('^/open-device[?]*', getFolder().path + 'Javascript/deviceRequestHandler.js', 'openDeviceHandler');