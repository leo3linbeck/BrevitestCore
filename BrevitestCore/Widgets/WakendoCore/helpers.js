WAF.define('kendoHelpers', [], function() {
	'use strict';
	
	function kendoDatasourceFromWakanda(wakandaDatasource, pageSize) {
		var fetchOptions = null;
		if (pageSize) {
			fetchOptions = {pageSize: pageSize};
		}
		
		function parseFilter(options) {
			if (!options.data.filter) return null;
			var filter = options.data.filter.filters[0];
			
			var attr = wakandaDatasource.attributeFor(filter.field);
			var query = attr + ' = :1';
			
			var value = filter.value;
			switch(filter.operator) {
				case 'startswith':
					value = value + '*';
					break;
				case 'endwith':
					value = '*' + value;
					break;
				case 'contains':
					value = '*' + value + '*';
					break;
			}
			return {
				attr: attr,
				query: query,
				value: value
			};
		}
		
		var dataChanged = function() {};
		wakandaDatasource.onPageChange(function(data) {
			dataChanged(data);
		});

		var kendoDatasource = new kendo.data.DataSource({
			serverFiltering: true,
			transport: {
				read: function(options) {
					dataChanged = options.success;
					var filter = parseFilter(options);
					if (filter) {
						wakandaDatasource().query(filter.query, filter.value);
					} else {
						wakandaDatasource.fetch(fetchOptions);
					}
				}
			}
		});
		return kendoDatasource;
	}
	
	
	return {
		toDate: function(str) {
			if (str instanceof Date) {
				return str;
			}
    		if (typeof str == 'string') {
    			return new Date(str);
    		}
    		return null;
		},
		kendoDatasourceFromWakanda: kendoDatasourceFromWakanda
	};

});
