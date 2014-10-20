
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonLoadShamData = {};	// @button
// @endregion// @endlock

// eventHandlers// @lock

	buttonLoadShamData.click = function buttonLoadShamData_click (event)// @startlock
	{// @endlock
		serverControl.loadShamData({
			onSuccess: function(evt) {
				debugger;
				console.log('Result: ', evt);
			},
			onError: function(err) {
				debugger;
				console.log('Result: ', err);
			}
		});
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("buttonLoadShamData", "click", buttonLoadShamData.click, "WAF");
// @endregion
};// @endlock
