﻿var data = {	classes: ['Practice', 'User', 'Physician', 'Manufacturer', 'Payer', 'Patient', 'Assay', 'DeviceModel', 'Device'],	Practice: [		{			ID: generateUUID(),			name: 'Houston Primary Care Associates, LLC',			salesTaxRate: 0.075		}	],	User: [		{			ID: generateUUID(),			username: 'leo3',			practice: 0		},		{			ID: generateUUID(),			username: 'dev',			practice: 0		},		{			ID: generateUUID(),			username: 'atul',			practice: 0		},		{			ID: generateUUID(),			username: 'erol',			practice: 0		}	],	Physician: [		{			ID: generateUUID(),			firstName: 'Leo',			middleName: 'Edward',			lastName: 'Linbeck',			suffix: 'III',			practice: 0,			user: 0		},		{			ID: generateUUID(),			firstName: 'Dev',			middleName: '',			lastName: 'Chatterjee',			suffix: '',			practice: 0,			user: 1		},		{			ID: generateUUID(),			firstName: 'Erol',			middleName: '',			lastName: 'Bakkalbasi',			suffix: '',			practice: 0,			user: 2		},		{			ID: generateUUID(),			firstName: 'Atul',			middleName: '',			lastName: 'Varadhachary',			suffix: '',			practice: 0,			user: 3		}	],	Manufacturer: [		{			ID: generateUUID(),			name: 'Brevitest LLC',			technicalPerson: 'Dev Chatterjee',			orderingPerson: 'Erol Bakkalbasi'		}	],	Payer: [		{			ID: generateUUID(),			name: 'Blue Cross Blue Shield of Texas',			type: 'Insurance Company',			billingPerson: 'Christopher Lee'		},		{			ID: generateUUID(),			name: 'Blue Cross Blue Shield of Oklahoma',			type: 'Insurance Company',			billingPerson: 'Jed Brophy'		},		{			ID: generateUUID(),			name: 'CIGNA',			type: 'Insurance Company',			billingPerson: 'Craig Parker'		},		{			ID: generateUUID(),			name: 'Center for Medicare and Medicaid Services',			type: 'Medicare',			billingPerson: 'John Noble'		},		{			ID: generateUUID(),			name: 'Texas Department of Health and Human Services',			type: 'Medicaid',			billingPerson: 'Sala Baker'		},		{			ID: generateUUID(),			name: 'Sean Bean',			type: 'Credit Card',			billingPerson: 'Sean Bean'		},		{			ID: generateUUID(),			name: 'Humana',			type: 'Insurance Company',			billingPerson: 'Hugo Weaving'		},	],	Patient: [		{			ID: generateUUID(),			reference: '123-45-6789',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '1/23/1945',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '234-56-7891',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '2/21/1962',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '345-67-8912',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '5/1/1958',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '456-78-9123',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '10/1/1978',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '567-89-1234',			practice: 0,			registeredOn: '10/1/2014',			dateOfBirth: '12/23/1949',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '678-91-2345',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '10/3/1975',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '789-12-3456',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '8/8/1988',			gender: 'Female'		},		{			ID: generateUUID(),			reference: '891-23-4567',			practice: 0,			registeredOn: '10/13/2014',			dateOfBirth: '4/20/1960',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '912-34-5678',			practice: 0,			registeredOn: '10/19/2014',			dateOfBirth: '9/2/1934',			gender: 'Male'		},		{			ID: generateUUID(),			reference: '987-65-4321',			practice: 0,			registeredOn: '10/19/2014',			dateOfBirth: '5/9/1972',			gender: 'Male'		}	],	PatientPrivateRecord: [		{			ID: generateUUID(),			patient: 0,			firstName: 'Sean',			middleName: '',			lastName: 'Bean',			suffix: ''		},		{			ID: generateUUID(),			patient: 1,			firstName: 'Dominic',			middleName: '',			lastName: 'Monaghan',			suffix: ''		},		{			ID: generateUUID(),			patient: 2,			firstName: 'William',			middleName: '',			lastName: 'Boyd',			suffix: ''		},		{			ID: generateUUID(),			patient: 3,			firstName: 'Miranda',			middleName: '',			lastName: 'Otto',			suffix: ''		},		{			ID: generateUUID(),			patient: 4,			firstName: 'Bernard',			middleName: '',			lastName: 'Hill',			suffix: ''		},		{			ID: generateUUID(),			patient: 5,			firstName: 'Sarah',			middleName: '',			lastName: 'McLeod',			suffix: ''		},		{			ID: generateUUID(),			patient: 6,			firstName: 'Robyn',			middleName: '',			lastName: 'Malcolm',			suffix: ''		},		{			ID: generateUUID(),			patient: 7,			firstName: 'Bradley',			middleName: '',			lastName: 'Dourif',			suffix: ''		},		{			ID: generateUUID(),			patient: 8,			firstName: 'Ian',			middleName: '',			lastName: 'Holm',			suffix: ''		},		{			ID: generateUUID(),			patient: 9,			firstName: 'Karl',			middleName: '',			lastName: 'Urban',			suffix: ''		}	],	Assay:[		{			ID: generateUUID(),			name: 'Brevitest Cortisol',			manufacturer: 0,			cpt: 28,			currentSalesPrice: 13.17,			lotSize: 1000,			redMax: 100,			greenMax: 80,			greenMin: 50,			redMin: 30,			domain: 0.1,			range: 150,			curveType: 'pow',			factorType: 'exponent',			factor: 0.1		},		{			ID: generateUUID(),			name: 'Brevitest BNP',			manufacturer: 0,			cpt: 28,			currentSalesPrice: 23.5,			lotSize: 300,			redMax: 130,			greenMax: 130,			greenMin: 50,			redMin: 50,			domain: 0.1,			range: 150,			curveType: 'pow',			factorType: 'exponent',			factor: 0.2		}	],	DeviceModel: [		{			ID: generateUUID(),			name: 'Brevitest Prototype v8'		}	],	Device: [		{			ID: generateUUID(),			serialNumber: 'HADK-KIMS-PIEL-NAIR',			practice: 0,			purchasedOn: '4/12/2014',			manufacturedOn: '4/1/2014',			shippedOn: '4/15/2014',			registeredOn: '4/28/2014',			deviceModel: 0		},		{			ID: generateUUID(),			serialNumber: 'IQWE-OMGA-NCIP-INKA',			sparkCoreID: '54ff72066678574959300667',			practice: 0,			purchasedOn: '4/9/2014',			manufacturedOn: '4/1/2014',			shippedOn: '4/12/2014',			deviceModel: 0		},		{			ID: generateUUID(),			serialNumber: 'LOBN-OANB-MLAI-YQNB',			sparkCoreID: '53ff71066678505539471467',			practice: 0,			purchasedOn: '3/30/2014',			manufacturedOn: '4/1/2014',			shippedOn: '4/22/2014',			registeredOn: '5/2/2014',			deviceModel: 0		},		{			ID: generateUUID(),			serialNumber: 'OBAD-BWUG-NCPA-WIAF',			sparkCoreID: '53ff6e066667574844262367',			practice: 0,			purchasedOn: '4/10/2014',			manufacturedOn: '4/15/2014',			shippedOn: '4/30/2014',			deviceModel: 0		},		{			ID: generateUUID(),			serialNumber: 'AMBZ-GHWK-PQLV-INDI',			practice: 0,			purchasedOn: '4/1/2014',			manufacturedOn: '4/15/2014',			shippedOn: '4/18/2014',			deviceModel: 0		},		{			ID: generateUUID(),			serialNumber: 'IGAE-MBKA-UEKF-JSIF',			practice: 0,			purchasedOn: '4/11/2014',			manufacturedOn: '4/15/2014',			shippedOn: '4/27/2014',			deviceModel: 0		},	]};var cptID = [];function importCPTCodes(importfile) {	var lines = loadText(importfile).split("\r");	var columns = [];	ds.CPT.all().remove();	lines.forEach(		function(oneLine) {			var cpt = ds.CPT.createEntity();			columns = oneLine.split('\t');			cpt.code = columns[0];			cpt.description = columns[1];			cpt.save();			cptID.push(cpt.ID);         }	);}function loadEntity(className, entity, obj) {	var k = Object.keys(obj);	k.forEach(		function(attr) {			var relClass, relID, relIndx;						if (attr === 'cpt') {				entity[attr] = ds.CPT(cptID[obj[attr]]);			}			else {				if (ds[className][attr].relatedDataClass) {					relClass = ds[className][attr].relatedDataClass.getName();					relIndx = obj[attr];					relID = data[relClass][relIndx].ID;					entity[attr] = ds[relClass](relID);				}				else {					if (ds[className][attr].type === 'date') {						entity[attr] = new Date(obj[attr]);					}					else {						entity[attr] = obj[attr];					}				}			}		}	);}function loadDataClass(className) {	var collect, dataClass;		dataClass = ds[className];	dataClass.all().remove();	collect = data[className];	collect.forEach(		function(obj) {			var entity = dataClass.createEntity();			loadEntity(className, entity, obj);			entity.save();		}	);}function reloadDatastore() {	importCPTCodes(getFolder('path') + 'Import Data/CPT Codes.tab');	data.classes.forEach(		function(c) {			loadDataClass(c);		}	);	ds.Prescription.all().remove();	ds.Test.all().remove();	ds.Cartridge.all().remove();	ds.Order.all().remove();	ds.OrderItem.all().remove();	ds.Shipment.all().remove();	ds.Assay.forEach(function(a) {		model.Cartridge.methods.manufacture(			{				assayID: a.ID,				quantity: 10			}		);	});}reloadDatastore();