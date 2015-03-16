﻿var btoa = require('w3c-windowbase64').btoa;exports.zeropad = function zeropad (num, numZeros) {	var an = Math.abs(num);    var digitCount = (num === 0 ? 1 : 1 + Math.floor (Math.log(an) / Math.LN10));	if (digitCount >= numZeros) {		return num;	}	var zeroString = Math.pow(10, numZeros - digitCount).toString ().substr(1);	return num < 0 ? '-' + zeroString.substr(1) + an.toString() : zeroString + an.toString();};exports.string_to_datetime = function string_to_datetime(str) {	return new Date(parseInt(str) * 1000);}exports.string_to_datetime_string = function string_to_datetime_string(str) {	return exports.string_to_datetime(str).toUTCString();}exports.get = function get(url, token) {    var result = {        'status': null,        'response': null    };        var xhr = new XMLHttpRequest();        xhr.open('GET', url);    xhr.setRequestHeader('Authorization', 'Bearer ' + token);    xhr.setRequestHeader('Content-Type', 'application/json');    xhr.onreadystatechange = function() {        if (this.readyState == 4) {            result.status = this.status;            var contentType = this.getResponseHeader('Content-Type');            if (contentType && contentType.indexOf('application/json') !== -1) {                result.response = JSON.parse(this.responseText);            }            else {                result.response = this.responseText;            }        }    };        console.log('GET', url);    xhr.send();    return result;};exports.post = function post(url, token, body) {    var result = {        'status': null,        'response': null    };        var xhr = new XMLHttpRequest();        xhr.open('POST', url);    xhr.setRequestHeader('Authorization', 'Bearer ' + token);    xhr.setRequestHeader('Content-Type', 'application/json');    xhr.onreadystatechange = function() {        if (this.readyState == 4) {            result.status = this.status;            if (result.status !== 0) {                var contentType = this.getResponseHeader('Content-Type');	            if (contentType && contentType.indexOf('application/json') !== -1) {	                result.response = JSON.parse(this.responseText);	            }	            else {	                result.response = this.responseText;	            }            }        }    };    	if (typeof body === 'object') {        xhr.send(JSON.stringify(body));	}	else {        xhr.send(body ? body : '');    }    console.log('POST', url, body);    return result;};exports.oauth = function oauth(url, username, password, un, pw) {	var postBody;	    var result = {        'status': null,        'response': null    };            var xhr = new XMLHttpRequest();        xhr.open('POST', url);    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');    xhr.onreadystatechange = function() {        if (this.readyState == 4) {            result.status = this.status;            if (result.status !== 0) {                var contentType = this.getResponseHeader('Content-Type');	            if (contentType && contentType.indexOf('application/json') !== -1) {	                result.response = JSON.parse(this.responseText);	            }	            else {	                result.response = this.responseText;	            }            }        }    };            postBody = 'grant_type=password&username=' + un() + '&password=' + pw();    xhr.send(postBody);    return result;};exports.qrImage2Code = function qrImage2Code(qrCodeImage) {	var c = ds.Cartridge.all().first();	return c.serialNumber;};var data = {	classes: ['Address', 'Practice', 'User', 'Physician', 'Manufacturer', 'Payer', 'Patient', 'Assay', 'DeviceModel', 'Device', 'Cartridge'],	Address: [		{			ID: generateUUID(),			number: '3900',			street1: 'Essex Lane',			street2: 'Suite 575',			city: 'Houston',			state: 'TX',			zipCode: '77027',			physical: true		},		{			ID: generateUUID(),			number: '1',			street1: 'Baylor Plaza',			street2: '',			city: 'Houston',			state: 'TX',			zipCode: '77030',			physical: true		},		{			ID: generateUUID(),			number: '1275',			street1: 'York Avenue',			street2: '',			city: 'New York',			state: 'NY',			zipCode: '10065',			physical: true		},		{			ID: generateUUID(),			number: '1515',			street1: 'Holcombe Blvd',			street2: '',			city: 'Houston',			state: 'TX',			zipCode: '77030',			physical: true		},		{			ID: generateUUID(),			number: '1600',			street1: 'Clifton Road',			street2: '',			city: 'Atlanta',			state: 'GA',			zipCode: '30329',			physical: true		},		{			ID: generateUUID(),			number: '2049',			street1: 'East 100th Street',			street2: '',			city: 'Cleveland',			state: 'OH',			zipCode: '44195',			physical: true		},		{			ID: generateUUID(),			number: '4500',			street1: 'San Pablo Road',			street2: '',			city: 'Jacksonville',			state: 'FL',			zipCode: '32224',			physical: true		},		{			ID: generateUUID(),			number: '200',			street1: 'First St. SW',			street2: '',			city: 'Rochester',			state: 'MN',			zipCode: '55905',			physical: true		},		{			ID: generateUUID(),			number: '13400',			street1: 'E. Shea Blvd.',			street2: '',			city: 'Scottsdale',			state: 'AZ',			zipCode: '85259',			physical: true		},		{			ID: generateUUID(),			number: '300',			street1: 'Pasteur Drive',			street2: '',			city: 'Stanford',			state: 'CA',			zipCode: '94556',			physical: true		}	],	Practice: [		{			ID: generateUUID(),			name: 'Brevitest, LLC',			physicalAddress: 0		},		{			ID: generateUUID(),			name: 'Baylor College of Medicine',			physicalAddress: 1		},		{			ID: generateUUID(),			name: 'Memorial Sloan Kettering Hospital',			physicalAddress: 2		},		{			ID: generateUUID(),			name: 'MD Anderson Cancer Center',			physicalAddress: 3		},		{			ID: generateUUID(),			name: 'Centers for Disease Control and Prevention',			physicalAddress: 4		},		{			ID: generateUUID(),			name: 'Mayo Clinic - Florida',			physicalAddress: 5		},		{			ID: generateUUID(),			name: 'Mayo Clinic - Minnesota',			physicalAddress: 6		},		{			ID: generateUUID(),			name: 'Mayo Clinic - Arizona',			physicalAddress: 7		},		{			ID: generateUUID(),			name: 'Cleveland Clinic',			physicalAddress: 8		},		{			ID: generateUUID(),			name: 'Stanford Hospital',			physicalAddress: 9		}	],	User: [		{			ID: generateUUID(),			username: 'leo3',			fullName: 'Leo Linbeck III',			practice: 0		},		{			ID: generateUUID(),			username: 'dev',			fullName: 'Dev Chatterjee',			practice: 0		},		{			ID: generateUUID(),			username: 'atul',			fullName: 'Atul Varadhachary',			practice: 0		},		{			ID: generateUUID(),			username: 'erol',			fullName: 'Erol Bakkalbasi',			practice: 0		}	],	Physician: [		{			ID: generateUUID(),			firstName: 'Leo',			middleName: 'Edward',			lastName: 'Linbeck',			suffix: 'III',			practice: 0,			user: 0		},		{			ID: generateUUID(),			firstName: 'Dev',			middleName: '',			lastName: 'Chatterjee',			suffix: '',			practice: 0,			user: 1		},		{			ID: generateUUID(),			firstName: 'Erol',			middleName: '',			lastName: 'Bakkalbasi',			suffix: '',			practice: 0,			user: 2		},		{			ID: generateUUID(),			firstName: 'Atul',			middleName: '',			lastName: 'Varadhachary',			suffix: '',			practice: 0,			user: 3		}	],	Manufacturer: [		{			ID: generateUUID(),			name: 'Brevitest LLC',			technicalPerson: 'Dev Chatterjee',			orderingPerson: 'Erol Bakkalbasi'		}	],	Payer: [		{			ID: generateUUID(),			name: 'Blue Cross Blue Shield of Texas',			type: 'Insurance Company',			billingPerson: 'Christopher Lee'		},		{			ID: generateUUID(),			name: 'Blue Cross Blue Shield of Oklahoma',			type: 'Insurance Company',			billingPerson: 'Jed Brophy'		},		{			ID: generateUUID(),			name: 'CIGNA',			type: 'Insurance Company',			billingPerson: 'Craig Parker'		},		{			ID: generateUUID(),			name: 'Center for Medicare and Medicaid Services',			type: 'Medicare',			billingPerson: 'John Noble'		},		{			ID: generateUUID(),			name: 'Texas Department of Health and Human Services',			type: 'Medicaid',			billingPerson: 'Sala Baker'		},		{			ID: generateUUID(),			name: 'Sean Bean',			type: 'Credit Card',			billingPerson: 'Sean Bean'		},		{			ID: generateUUID(),			name: 'Humana',			type: 'Insurance Company',			billingPerson: 'Hugo Weaving'		},	],	Patient: [		{			ID: generateUUID(),			reference: '123-45-6789',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '1/23/1945',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '234-56-7891',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '2/21/1962',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '345-67-8912',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '5/1/1958',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '456-78-9123',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '10/1/1978',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '567-89-1234',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '12/23/1949',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '678-91-2345',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '10/3/1975',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '789-12-3456',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '8/8/1988',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '891-23-4567',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '4/20/1960',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '912-34-5678',			practice: 0,			registeredOn: '10/19/2014',			dateOfBirth: '9/2/1934',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '987-65-4321',			practice: 0,			registeredOn: '10/19/2014',			dateOfBirth: '5/9/1972',			gender: 'Male'		}	],	PatientPrivateRecord: [		{			ID: generateUUID(),			patient: 0,			firstName: 'Sean',			middleName: '',			lastName: 'Bean',			suffix: ''		},		{			ID: generateUUID(),			patient: 1,			firstName: 'Dominic',			middleName: '',			lastName: 'Monaghan',			suffix: ''		},		{			ID: generateUUID(),			patient: 2,			firstName: 'William',			middleName: '',			lastName: 'Boyd',			suffix: ''		},		{			ID: generateUUID(),			patient: 3,			firstName: 'Miranda',			middleName: '',			lastName: 'Otto',			suffix: ''		},		{			ID: generateUUID(),			patient: 4,			firstName: 'Bernard',			middleName: '',			lastName: 'Hill',			suffix: ''		},		{			ID: generateUUID(),			patient: 5,			firstName: 'Sarah',			middleName: '',			lastName: 'McLeod',			suffix: ''		},		{			ID: generateUUID(),			patient: 6,			firstName: 'Robyn',			middleName: '',			lastName: 'Malcolm',			suffix: ''		},		{			ID: generateUUID(),			patient: 7,			firstName: 'Bradley',			middleName: '',			lastName: 'Dourif',			suffix: ''		},		{			ID: generateUUID(),			patient: 8,			firstName: 'Ian',			middleName: '',			lastName: 'Holm',			suffix: ''		},		{			ID: generateUUID(),			patient: 9,			firstName: 'Karl',			middleName: '',			lastName: 'Urban',			suffix: ''		}	],	Assay:[		{			ID: generateUUID(),			name: 'Brevitest Cortisol',			BCODE: '0,235,1\n2,4100,1200\n12,4\n1,2000\n12,4\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n2,200,1800\n13\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n1,2000\n2,200,2000\n2,800,1800\n2,200,2000\n13\n1,2000\n12,6\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n2,200,1800\n13\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n1,2000\n7,20\n1,1000\n9,10,500\n8\n14,13,Test finished\n99',			manufacturer: 0,			cpt: 28,			currentSalesPrice: 13.17,			lotSize: 1000,			redMax: 100,			greenMax: 80,			greenMin: 50,			redMin: 30,			domain: 0.1,			range: 150,			curveType: 'pow',			factorType: 'exponent',			factor: 0.1		},		{			ID: generateUUID(),			name: 'Brevitest BNP',			BCODE: '0,235,1\n2,4100,1200\n12,4\n1,2000\n12,4\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n2,200,1800\n13\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n1,2000\n2,200,2000\n2,800,1800\n2,200,2000\n13\n1,2000\n12,6\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n2,200,1800\n13\n3,2200\n1,500\n12,4\n3,750\n1,250\n13\n1,2000\n7,20\n1,1000\n9,10,500\n8\n14,13,Test finished\n99',			manufacturer: 0,			cpt: 28,			currentSalesPrice: 23.5,			lotSize: 300,			redMax: 130,			greenMax: 130,			greenMin: 50,			redMin: 50,			domain: 0.1,			range: 150,			curveType: 'pow',			factorType: 'exponent',			factor: 0.2		}	],	DeviceModel: [		{			ID: generateUUID(),			name: 'Brevitest Prototype v8'		},		{			ID: generateUUID(),			name: 'Brevitest Prototype v7 (OBSOLETE)'		}	],	Device: [		{			ID: generateUUID(),			name: 'The Godfather',			serialNumber: 'IQWE-OMGA-NCIP-INKA',			sparkCoreID: '54ff72066678574959300667',			online: false,			practice: 0,			purchasedOn: '4/9/2014',			manufacturedOn: '4/1/2014',			shippedOn: '4/12/2014',			deviceModel: 0		},		{			ID: generateUUID(),			name: 'The Matrix',			serialNumber: 'LOBN-OANB-MLAI-YQNB',			sparkCoreID: '51ff6f065082554937400887',			online: false,			practice: 0,			purchasedOn: '3/30/2014',			manufacturedOn: '4/1/2014',			shippedOn: '4/22/2014',			deviceModel: 0		},		{			ID: generateUUID(),			name: 'The Man Who Shot Liberty Valance',			serialNumber: 'OBAD-BWUG-NCPA-WIAF',			sparkCoreID: '53ff6f066667574848390967',			online: false,			practice: 0,			purchasedOn: '4/10/2014',			manufacturedOn: '4/15/2014',			shippedOn: '4/30/2014',			deviceModel: 0		}	],	Cartridge: [		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			registeredOn: '2/4/2015',			assay: 0,			practice: 0,			registeredBy: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			registeredOn: '2/4/2015',			assay: 0,			practice: 0,			registeredBy: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 0,			practice: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 0,			practice: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 0,			practice: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 1,			practice: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 1,			practice: 0		},		{			ID: generateUUID(),			manufacturedOn: '1/30/2015',			assay: 1,			practice: 0		},	]};var cptID = [];function importCPTCodes(importfile) {	var lines = loadText(importfile).split("\r");	var columns = [];	ds.CPT.all().remove();	lines.forEach(		function(oneLine) {			var cpt = ds.CPT.createEntity();			columns = oneLine.split('\t');			cpt.code = columns[0];			cpt.description = columns[1];			cpt.save();			cptID.push(cpt.ID);         }	);}function loadEntity(className, entity, obj) {	var k = Object.keys(obj);	k.forEach(		function(attr) {			var relClass, relID, relIndx;						if (attr === 'cpt') {				entity[attr] = ds.CPT(cptID[obj[attr]]);			}			else {				if (ds[className][attr].relatedDataClass) {					relClass = ds[className][attr].relatedDataClass.getName();					relIndx = obj[attr];					relID = data[relClass][relIndx].ID;					entity[attr] = ds[relClass](relID);				}				else {					if (ds[className][attr].type === 'date') {						entity[attr] = new Date(obj[attr]);					}					else {						entity[attr] = obj[attr];					}				}			}		}	);}function loadDataClass(className) {	var collect, dataClass;		dataClass = ds[className];	dataClass.all().remove();	collect = data[className];	collect.forEach(		function(obj) {			var entity = dataClass.createEntity();			loadEntity(className, entity, obj);			entity.save();		}	);}function reloadDatastore() {	importCPTCodes(getFolder('path') + 'Import Data/CPT Codes.tab');	data.classes.forEach(		function(c) {			loadDataClass(c);		}	);	ds.Test.all().remove();	ds.Prescription.all().remove();	ds.Order.all().remove();	ds.OrderItem.all().remove();	ds.Shipment.all().remove();}exports.initialize_database = function initialize_database() {	reloadDatastore();};