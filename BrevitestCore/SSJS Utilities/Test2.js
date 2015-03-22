var eventsource = require('wakanda-eventsource');
eventsource.start();

for (var i = 0; i < 5; i += 1) {
	eventsource.pushEvent('test', {i: i, message: 'try #' + i}, true);
	wait(2000);
}