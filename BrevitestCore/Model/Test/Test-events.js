﻿model.Test.patientInfo.onGet = function() {	return ('ID: ' + this.patientNumber + '; ' + this.prescription.patientGender + '; DOB: ' + this.prescription.patientDOB.toDateString().substring(4));};model.Test.isComplete.onGet = function() {	return (this.finishedOn !== null && this.result !== null);};