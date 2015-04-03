
var shouldTerminate;

onmessage = function(e) {
	var result;
	var data = e.data;
	var message = data.message;
	var params = data.params;
	
	shouldTerminate = e.data.shouldTerminate ? true : false;
	
	try {
		if (data.message === 'start') {
			postMessage({message:'start message'});
//
//			do some stuff
//
			postMessage({message:'interim message'});
//
//			do some more stuff
//
			postMessage({message:'done'});
		}
	}
	catch(e) {
		postMessage({message:'error'});
	}
}
