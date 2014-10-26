
WAF.onAfterInit = function onAfterInit() {// @lock

// @region namespaceDeclaration// @startlock
	var buttonRefreshStatus = {};	// @button
	var row8 = {};	// @container
	var buttonStart = {};	// @button
	var row3 = {};	// @container
	var row2 = {};	// @container
	var assayListEvent = {};	// @dataSource
	var imageButton2 = {};	// @buttonImage
	var imageButton1 = {};	// @buttonImage
	var patientEvent = {};	// @dataSource
	var buttonAssayUZ = {};	// @button
	var buttonAssayPT = {};	// @button
	var buttonAssayKO = {};	// @button
	var buttonAssayFJ = {};	// @button
	var buttonAssayAE = {};	// @button
	var buttonAssayAll = {};	// @button
	var row1 = {};	// @container
	var buttonWritePrescription = {};	// @button
	var textFieldPatientNumber = {};	// @textField
	var buttonRegister = {};	// @button
	var login1 = {};	// @login
	var documentEvent = {};	// @document
	var buttonReview = {};	// @button
	var buttonMonitor = {};	// @button
	var buttonRun = {};	// @button
	var buttonPrescribe = {};	// @button
// @endregion// @endlock

	var notification = humane.create({ timeout: 2000, baseCls: 'humane-original' });
	notification.error = humane.spawn({ addnCls: 'humane-original-error', clickToClose: true, timeout: 0 });
	notification.progress = humane.spawn({ addnCls: 'humane-original', timeout: 0 });
	
	function notify(text) {
		notification.log(text);
	}
	
	function notifyProgress(text) {
		notification.progress(text);
	}
	
	function notifyError(text, error) {
		notification.error(text + (error ? ' - ' + JSON.stringify(error) : ''));
	}
	
	function disableAllButtons() {
		$$('buttonRegister').disable();
		$$('buttonPrescribe').disable();
		$$('buttonRun').disable();
		$$('buttonMonitor').disable();
		$$('buttonReview').disable();
	}
	
	function enableAllButtons() {
		$$('buttonRegister').enable();
		$$('buttonPrescribe').enable();
		$$('buttonRun').enable();
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
				orderBy: 'name',
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
				orderBy: 'name',
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
		$$('richTextPatientInfo').setValue('');
		assayList.length = 0;
		sources.assayList.sync();
		prescriptionNote = '';
		sources.prescriptionNote.sync();
		$$('buttonWritePrescription').disable();
	}
	
	function writePrescription() {
		$$('buttonWritePrescription').disable();
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
	
	function loadAssayList() {
		allAssays(
			function(event) {
				$$('navigationView1').goToView(7);
			}
		);
	}

	function removeLastAssay() {
		assayList.splice(assayList.length - 1, 1);
		sources.assayList.sync();
	}
	
	function loadUnstartedTests(callback) {
		sources.testUnstarted.query('startedOn === null',
			{
				onSuccess: function(event) {
					console.log('loadUnstartedTests', event);
					if (callback) {
						callback(event);
					}
				},
				onError: function(error) {
					console.log('ERROR: loadUnstartedTests', error);
				},
				orderBy: 'prescribedOn'
			}
		);
	}

	function loadTestsInProgress(callback) {
		sources.testUnderway.query('startedOn !== null AND finishedOn === null',
			{
				onSuccess: function(event) {
					console.log('loadTestsInProgress', event);
					if (callback) {
						callback(event);
					}
				},
				onError: function(error) {
					console.log('ERROR: loadTestsInProgress', error);
				},
				orderBy: 'startedOn'
			}
		);
	}

	function loadDevices(callback) {
		sources.device.query('practice.users.username == :1',
			{
				onSuccess: function(event) {
					console.log('loadDevices', event);
					if (callback) {
						callback(event);
					}
				},
				onError: function(error) {
					console.log('ERROR: loadDevices', error);
				},
				orderBy: 'modelName, serialNumber',
				params: [WAF.directory.currentUser().userName]
			}
		);
	}
	
	function startTest() {
		sources.testUnstarted.start(
			{
				onSuccess: function(event) {
					if (event.result && event.result.success) {
						notify('Test started. Go to Monitor Tests to check progress.');
						$$('navigationView1').goToView(1);
					}
					else {
						notifyError('Test failed to start');
						console.log('ERROR: startTest', event);
					}
				},
				onError: function(error) {
					notifyError('Test failed to start: ' + JSON.stringify(error));
				}
			},
			{
				testID: sources.testUnstarted.ID,
				deviceID: sources.device.ID,
				username: WAF.directory.currentUser().userName
			}
		);
	}

	
// eventHandlers// @lock

	buttonRefreshStatus.click = function buttonRefreshStatus_click (event)// @startlock
	{// @endlock
		sources.testUnderway.serverRefresh({
			onSuccess: function(evt) {
				console.log('sources.testUnderway.serverRefresh', evt);
			},
			onError: function(err) {
				console.log('ERROR: sources.testUnderway.serverRefresh', err);
			}
		});
	};// @lock

	row8.click = function row8_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(10);
	};// @lock

	buttonStart.click = function buttonStart_click (event)// @startlock
	{// @endlock
		startTest();
	};// @lock

	row3.click = function row3_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(9);
	};// @lock

	row2.click = function row2_click (event)// @startlock
	{// @endlock
		loadDevices(
			function(e) {
				$$('navigationView1').goToView(8);
			}
		);
	};// @lock

	assayListEvent.onCollectionChange = function assayListEvent_onCollectionChange (event)// @startlock
	{// @endlock
		updateWritePrescriptionButton();
	};// @lock

	imageButton2.click = function imageButton2_click (event)// @startlock
	{// @endlock
		removeLastAssay();
	};// @lock

	imageButton1.click = function imageButton1_click (event)// @startlock
	{// @endlock
		loadAssayList();
	};// @lock

	patientEvent.onCurrentElementChange = function patientEvent_onCurrentElementChange (event)// @startlock
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
		loadTestsInProgress(
			function(e) {
				$$('navigationView1').goToView(4);
			}
		);

	};// @lock

	buttonRun.click = function buttonRun_click (event)// @startlock
	{// @endlock
		loadUnstartedTests(
			function(e) {
				$$('navigationView1').goToView(3);
			}
		);
	};// @lock

	buttonPrescribe.click = function buttonPrescribe_click (event)// @startlock
	{// @endlock
		$$('navigationView1').goToView(2);
		$$('textFieldPatientNumber').focus();
	};// @lock

// @region eventManager// @startlock
	WAF.addListener("buttonRefreshStatus", "click", buttonRefreshStatus.click, "WAF");
	WAF.addListener("row8", "click", row8.click, "WAF");
	WAF.addListener("buttonStart", "click", buttonStart.click, "WAF");
	WAF.addListener("row3", "click", row3.click, "WAF");
	WAF.addListener("row2", "click", row2.click, "WAF");
	WAF.addListener("assayList", "onCollectionChange", assayListEvent.onCollectionChange, "WAF");
	WAF.addListener("imageButton2", "click", imageButton2.click, "WAF");
	WAF.addListener("imageButton1", "click", imageButton1.click, "WAF");
	WAF.addListener("patient", "onCurrentElementChange", patientEvent.onCurrentElementChange, "WAF");
	WAF.addListener("buttonAssayUZ", "click", buttonAssayUZ.click, "WAF");
	WAF.addListener("buttonAssayPT", "click", buttonAssayPT.click, "WAF");
	WAF.addListener("buttonAssayKO", "click", buttonAssayKO.click, "WAF");
	WAF.addListener("buttonAssayFJ", "click", buttonAssayFJ.click, "WAF");
	WAF.addListener("buttonAssayAE", "click", buttonAssayAE.click, "WAF");
	WAF.addListener("buttonAssayAll", "click", buttonAssayAll.click, "WAF");
	WAF.addListener("row1", "click", row1.click, "WAF");
	WAF.addListener("buttonWritePrescription", "click", buttonWritePrescription.click, "WAF");
	WAF.addListener("textFieldPatientNumber", "change", textFieldPatientNumber.change, "WAF");
	WAF.addListener("buttonRegister", "click", buttonRegister.click, "WAF");
	WAF.addListener("login1", "logout", login1.logout, "WAF");
	WAF.addListener("login1", "login", login1.login, "WAF");
	WAF.addListener("document", "onLoad", documentEvent.onLoad, "WAF");
	WAF.addListener("buttonReview", "click", buttonReview.click, "WAF");
	WAF.addListener("buttonMonitor", "click", buttonMonitor.click, "WAF");
	WAF.addListener("buttonRun", "click", buttonRun.click, "WAF");
	WAF.addListener("buttonPrescribe", "click", buttonPrescribe.click, "WAF");
// @endregion
};// @endlock
