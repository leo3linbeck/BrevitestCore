var cartridges = ds.Cartridge.query('test.percentComplete === 100 AND finishedOn === null');
cartridges.forEach(function(c) {
	c.get_data_from_device();
});

cartridges = ds.Cartridge.query('test.percentComplete < 100 AND test.percentComplete !== null AND startedOn < :1', new Date(new Date() - 1200000));
cartridges.forEach(function(c) {
	c.mark_as_failed();
});
