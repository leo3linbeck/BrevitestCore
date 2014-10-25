
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var row1 = {};	// @container
	var buttonWritePrescription = {};	// @button
	var textFieldPatientNumber = {};	// @textField
	var icon2 = {};	// @icon
	var buttonRegister = {};	// @button
	var login1 = {};	// @login
	var documentEvent = {};	// @document
	var buttonReview = {};	// @button
	var buttonMonitor = {};	// @button
	var buttonStart = {};	// @button
	var buttonPrescribe = {};	// @button
// @endregion// @endlock

	function disableAllButtons() {
		$$('buttonRegister').disable();
		$$('buttonPrescribe').disable();
		$$('buttonStart').disable();
		$$('buttonMonitor').disable();
		$$('buttonReview').disable();
	}
	
	function enableAllButtons() {
		$$('buttonRegister').enable();
		$$('buttonPrescribe').enable();
		$$('buttonStart').enable();
		$$('buttonMonitor').enable();
		$$('buttonReview').enable();
	}
	
	selectedAssays = [];

// eventHandlers// @lock

	row1.click = function row1_click (event)// @startlock
	{// @endlock
		assayList.push({ ID: sources.assay.ID, name: sources.assay.name });
		sources.assayList.sync();
		$$('navigationView1').goToPreviousView();
	};// @lock

	buttonWritePrescription.click = function buttonWritePrescription_click (event)// @startlock
	{// @endlock
		// Add your code here
	};// @lock

	textFieldPatientNumber.change = function textFieldPatientNumber_change (event)// @startlock
	{// @endlock
		sources.patient.query('reference === :1',
			{
				onSuccess: function(evt) {
					console.log('textFieldPatientNumber.change', evt);
					$$('richTextPatientInfo').setValue(evt.dataSource.gender + ', DOB: ' + evt.dataSource.dateOfBirth.toDateString());
				},
				onError: function(err) {
					console.log('ERROR: textFieldPatientNumber.change', err);
					$$('richTextPatientInfo').setValue('');
				},
				params: [$$('textFieldPatientNumber').getValue()]
			}
		);
	};// @lock

	icon2.click = function icon2_click (event)// @startlock
	{// @endlock
		selectedAssays = [];
		sources.assay.all(
			{
				onSuccess: function(evt) {
					console.log('icon2.click', evt);
				},
				onError: function(err) {
					console.log('ERROR: icon2.click', err);
				},
				orderBy: [name]
			}
		);
		$$('navigationView1').goToView(7);
	};// @lock

	buttonRegister.click = function buttonRegister_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(6);
	};// @lock

	login1.logout = function login1_logout (event)// @startlock
	{// @endlock
		disableAllButtons();
	};// @lock

	login1.login = function login1_login (event)// @startlock
	{// @endlock
		enableAllButtons();
	};// @lock

	documentEvent.onLoad = function documentEvent_onLoad (event)// @startlock
	{// @endlock
		if (WAF.directory.currentUser() === null) {
			disableAllButtons();
		}
		else {
			enableAllButtons();
		}
	};// @lock

	buttonReview.click = function buttonReview_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(5);
	};// @lock

	buttonMonitor.click = function buttonMonitor_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(4);
	};// @lock

	buttonStart.click = function buttonStart_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(3);
	};// @lock

	buttonPrescribe.click = function buttonPrescribe_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(2);
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("row1", "click", row1.click, "WAF");
	WAF.addListener("buttonWritePrescription", "click", buttonWritePrescription.click, "WAF");
	WAF.addListener("textFieldPatientNumber", "change", textFieldPatientNumber.change, "WAF");
	WAF.addListener("icon2", "click", icon2.click, "WAF");
	WAF.addListener("buttonRegister", "click", buttonRegister.click, "WAF");
	WAF.addListener("login1", "logout", login1.logout, "WAF");
	WAF.addListener("login1", "login", login1.login, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("buttonReview", "click", buttonReview.click, "WAF");
	WAF.addListener("buttonMonitor", "click", buttonMonitor.click, "WAF");
	WAF.addListener("buttonStart", "click", buttonStart.click, "WAF");
	WAF.addListener("buttonPrescribe", "click", buttonPrescribe.click, "WAF");
// @endregion
};// @endlock
