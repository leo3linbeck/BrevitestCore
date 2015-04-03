

model.Practice.googleMapAddress.onGet = function() {
	return (
		  this.physicalAddress.number
		+ (this.physicalAddress.street1 && this.physicalAddress.number ? ' ' : '') + this.physicalAddress.street1
		+ (this.physicalAddress.street2 ? ' ' : '') + this.physicalAddress.street2
		+ (this.physicalAddress.city ? ', ' : '') + this.physicalAddress.city
		+ (this.physicalAddress.state ? ', ' : '') + this.physicalAddress.state
		+ (this.physicalAddress.zipCode ? ' ' : '') + this.physicalAddress.zipCode
	);
};
