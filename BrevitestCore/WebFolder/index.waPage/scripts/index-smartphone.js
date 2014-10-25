
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var patientEvent = {};	// @dataSource
	var assayEvent = {};	// @dataSource
	var buttonAssayUZ = {};	// @button
	var buttonAssayPT = {};	// @button
	var buttonAssayKO = {};	// @button
	var buttonAssayFJ = {};	// @button
	var buttonAssayAE = {};	// @button
	var buttonAssayAll = {};	// @button
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

	var notification = humane.create({ timeout: 2000, baseCls: 'humane-original' });
	notification.error = humane.spawn({ addnCls: 'humane-original-error', clickToClose: true, timeout: 0 });
	function notify(text) {
		notification.log(text);
	}
	
	function notifyError(text, error) {
		notification.error(text + (error ? ' - ' + JSON.stringify(error) : ''));
	}
	
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

	assayButtons = ['buttonAssayAll', 'buttonAssayAE', 'buttonAssayFJ', 'buttonAssayKO', 'buttonAssayPT', 'buttonAssayUZ'];

	function highlightAssayButton(highlight) {
		assayButtons.forEach(
			function (e) {
				if (e === highlight) {
					$$(e).setBackgroundColor('rgb(21, 126,250)');
					$$(e).setTextColor('#FFFFFF');
				}
				else {
					$$(e).setBackgroundColor('#FFFFFF');
					$$(e).setTextColor('rgb(21, 126,250)');
				}	
			}
		);
	}
	
	function getAssayIDList() {
		var assayIDs = [];
		
		assayList.forEach(
			function (e) {
				assayIDs.push(e.ID);	
			}
		);
		if (assayIDs.length === 0) {
			assayIDs.push('');	
		}
		
		return assayIDs;
	}
		
	function filterAssays(startChar, endChar, buttonID) {
		sources.assay.query('NOT ID in :1 AND name >= :2 AND name <= :3',
			{
				onSuccess: function(event) {
					highlightAssayButton(buttonID);
					console.log('allAssays', event);
				},
				onError: function(error) {
					console.log('ERROR: allAssays', error);
				},
				orderBy: [name],
				params: [getAssayIDList(), startChar, endChar]
			}
		);
	}
	
	function allAssays(callback) {
		sources.assay.query('NOT ID in :1',
			{
				onSuccess: function(event) {
					console.log('allAssays', event);
					if (callback) {
						callback(event);
					}
					highlightAssayButton('buttonAssayAll');
				},
				onError: function(error) {
					console.log('ERROR: allAssays', error);
				},
				orderBy: [name],
				params: [getAssayIDList()]
			}
		);
	}
	
	function loadPatientInfo() {
		sources.patient.query('reference === :1',
			{
				onSuccess: function(event) {
					console.log('textFieldPatientNumber.change', event);
					if (event.dataSource.length) {
						$$('richTextPatientInfo').setValue(event.dataSource.gender + ', DOB: ' + event.dataSource.dateOfBirth.toDateString().substring(4));
					}
					else {
						$$('richTextPatientInfo').setValue('Patient not found');
					}
				},
				onError: function(error) {
					console.log('ERROR: textFieldPatientNumber.change', error);
					$$('richTextPatientInfo').setValue('Error: ' + error.message);
				},
				params: [patientNumber]
			}
		);
	}
	
	function updateWritePrescriptionButton() {
		if (assayList.length > 0 && sources.patient.length === 1) {
			$$('buttonWritePrescription').enable();
		}
		else {	
			$$('buttonWritePrescription').disable();
		}
	}
	
	function clearPrescriptionForm() {
		sources.patient.query('ID === null', {onSuccess: function(e) {return;} } );
		patientNumber = '';
		sources.patientNumber.sync();
		assayList.length = 0;
		sources.assayList.sync();
		prescriptionNote = '';
		sources.prescriptionNote.sync();
		$$('buttonWritePrescription').disable();
	}
	
	function writePrescription() {
		sources.prescription.write(
			{
				onSuccess: function(event) {
					if (event.result.success) {
						console.log('writePrescription', event);
						notify('New prescription written with ' + event.result.testCount + ' test(s)');
						clearPrescriptionForm();
					}
					else {
						console.log('ERROR: writePrescription', event);
						notify('Error writing new prescription ' + JSON.stringify(event));
					}
				},
				onError: function(error) {
					console.log('ERROR: writePrescription', error);
					notifyError('System error writing new prescription. ' + JSON.stringify(error));
				}
			},
			{
				username: 		WAF.directory.currentUser().userName,
				patientID: 		sources.patient.ID,
				tests: 			getAssayIDList(),
				note: 			prescriptionNote
			}
		);
	}
	
// eventHandlers// @lock

	patientEvent.onCurrentElementChange = function patientEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		updateWritePrescriptionButton();
	};// @lock

	assayEvent.onCurrentElementChange = function assayEvent_onCurrentElementChange (event)// @startlock
	{// @endlock
		updateWritePrescriptionButton();
	};// @lock

	buttonAssayUZ.click = function buttonAssayUZ_click (event)// @startlock
	{// @endlock
		filterAssays('U', 'ZZZZZZ', this.id);
	};// @lock

	buttonAssayPT.click = function buttonAssayPT_click (event)// @startlock
	{// @endlock
		filterAssays('P', 'TZZZZZ', this.id);
	};// @lock

	buttonAssayKO.click = function buttonAssayKO_click (event)// @startlock
	{// @endlock
		filterAssays('K', 'OZZZZZ', this.id);
	};// @lock

	buttonAssayFJ.click = function buttonAssayFJ_click (event)// @startlock
	{// @endlock
		filterAssays('F', 'JZZZZZ', this.id);
	};// @lock

	buttonAssayAE.click = function buttonAssayAE_click (event)// @startlock
	{// @endlock
		filterAssays('A', 'EZZZZZ', this.id);
	};// @lock

	buttonAssayAll.click = function buttonAssayAll_click (event)// @startlock
	{// @endlock
		allAssays();
	};// @lock

	row1.click = function row1_click (event)// @startlock
	{// @endlock
		assayList.push({ ID: sources.assay.ID, name: sources.assay.name });
		sources.assayList.sync();
		$$('navigationView1').goToPreviousView();
	};// @lock

	buttonWritePrescription.click = function buttonWritePrescription_click (event)// @startlock
	{// @endlock
		writePrescription();
	};// @lock

	textFieldPatientNumber.change = function textFieldPatientNumber_change (event)// @startlock
	{// @endlock
		loadPatientInfo();
	};// @lock

	icon2.click = function icon2_click (event)// @startlock
	{// @endlock
		allAssays(
			function(event) {
				$$('navigationView1').goToView(7);
			}
		);
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
		
		$$('buttonWritePrescription').disable();
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
		$$('textFieldPatientNumber').focus();
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("patient", "onCurrentElementChange", patientEvent.onCurrentElementChange, "WAF");
	WAF.addListener("assay", "onCurrentElementChange", assayEvent.onCurrentElementChange, "WAF");
	WAF.addListener("buttonAssayUZ", "click", buttonAssayUZ.click, "WAF");
	WAF.addListener("buttonAssayPT", "click", buttonAssayPT.click, "WAF");
	WAF.addListener("buttonAssayKO", "click", buttonAssayKO.click, "WAF");
	WAF.addListener("buttonAssayFJ", "click", buttonAssayFJ.click, "WAF");
	WAF.addListener("buttonAssayAE", "click", buttonAssayAE.click, "WAF");
	WAF.addListener("buttonAssayAll", "click", buttonAssayAll.click, "WAF");
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
