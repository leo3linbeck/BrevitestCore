﻿model.Test.patientInfo.onGet = function() {	return '';//	return ('ID: ' + this.patientNumber + '; ' + this.prescription.patientGender + '; DOB: ' + this.prescription.patientDOB.toDateString().substring(4));};model.Test.isComplete.onGet = function() {	return (this.finishedOn !== null);};model.Test.rawData.onGet = function() {	var c = this.cartridges.find('failed === false');	return (c ? c.rawData : null);};model.Test.result.onGet = function() {	var c = this.cartridges.find('failed === false');	return (c ? c.result : null);};model.Test.isComplete.onQuery = function(compOperator, valueToCompare) {	if (compOperator === '=' || compOperator === '==' || compOperator === '===') {		if(compareValue) {			return 'finishedOn !== null';		}		else {			return 'finishedOn === null';		}	}	else {		if(compareValue) {			return 'finishedOn === null';		}		else {			return 'finishedOn !== null';		}	}};model.Test.listViewLine2.onGet = function() {	return (this.startedOn.toLocaleDateString() + ' ' + this.startedOn.toLocaleTimeString() + ' (' + this.status + ')');};model.Test.cartridgeID.onGet = function() {	var c = this.cartridges.find('failed === false');	return (c ? c.ID : null);};model.Test.outcome.onGet = function() {	if (this.result) {		if (this.result > this.assayRedMax) {			return 'Positive - High';		}		if (this.result < this.assayRedMin) {			return 'Positive - Low';		}		if (this.result > this.assayGreenMax) {			return 'Borderline - High';		}		if (this.result < this.assayGreenMin) {			return 'Borderline - Low';		}		return 'Negative';	}	else {		return null;	}};