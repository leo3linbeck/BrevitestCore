

model.Assay.events.save = function(event) {
	if (!this.manufacturer) {
		this.manufacturer = ds.Manufacturer('C81B936897FD4231B283F12FD3FED4A1');
	}
	if (!this.cpt) {
		this.cpt = ds.CPT('B5DDC0D767864E1AAB694B5A5EBD7646');
	}
};
