WAF.define('Text', ['waf-core/widget'], function(Widget) {
    "use strict";

    var Text = Widget.create('Text', {
        value: Widget.property({
            defaultValueCallback: function() {
                return this.node.innerHTML;
            }
        }),
        url: Widget.property({ type: 'string' }),
        urlTarget: Widget.property({
            type: 'enum',
            values: ['_blank', '_self'],
            bindable: false
        }),
        plainText: Widget.property({
            type: 'boolean',
            defaultValue: true,
            bindable: false
        }),
        render: function() {
            if(this.plainText()) {
                this.node.textContent = this.value();
            } else {
                this.node.innerHTML = this.value();
            }
        },
        init: function() {
            this.render();
            this.value.onChange(this.render);
            this.plainText.onChange(this.render);

            $(this.node).on('click', function() {
                if(this.url()) {
                    if(this.urlTarget() === '_blank') {
                        window.open(this.url());
                    } else {
                        window.location = this.url();
                    }
                }
            }.bind(this));
        }
    });

    return Text;
});
