(function(CheckBox) {
    "use strict";

    CheckBox.setWidth(16);
    CheckBox.setHeight(16);

    CheckBox.addLabel();

    // disable click
    CheckBox.doAfter('init', function() {
        $(this.node).off('change', this._changeHandler);
        $(this.node).on('change', function() {
            this.node.checked = this.value();
        }.bind(this));
    });
});
