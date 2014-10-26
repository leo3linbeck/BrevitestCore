(function(Text) {
    "use strict";
    Text.setWidth(50);
    Text.setHeight(16);

    Text.customizeProperty('value', { multiline: true });

    var showUrl = function() {
        if(this.url() || this.url.boundDatasource()) {
            this.urlTarget.show();
        } else {
            this.urlTarget.hide();
        }
    };

    Text.doAfter('init', function() {
        showUrl.call(this);
        this.url.onChange(showUrl);
        this.subscribe('datasourceBindingChange', 'url', showUrl, this);
    });

    Text.addLabel({ defaultValue: '' });
});
