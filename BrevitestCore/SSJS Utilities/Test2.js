var dispatchManager = new SharedWorker('Workers/DispatchManager.js', 'DispatchManager');

dispatchManager.port.postMessage({message: 'runOnce', func: 'test', params: {x: 1, y: 2} });
