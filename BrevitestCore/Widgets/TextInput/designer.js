(function(TextInput) {
    "use strict";

    TextInput.setWidth(92);
    TextInput.setHeight(22);

    TextInput.addLabel();

    TextInput.customizeProperty('editValue', { display: false, sourceDisplay: false });
    TextInput.customizeProperty('displayValue', { display: false, sourceDisplay: false });

    var showAutocomplete = function() {
        if(this.value.boundDatasource()) {
            this.autocomplete.show();
            this.format.show();
        } else {
            this.autocomplete.hide();
            this.format.hide();
        }
    };

    TextInput.doAfter('init', function() {
        showAutocomplete.call(this);
        this.value.onChange(showAutocomplete);
        this.subscribe('datasourceBindingChange', 'value', showAutocomplete, this);

    });
});
