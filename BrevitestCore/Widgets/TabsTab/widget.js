WAF.define('TabsTab', ['waf-core/widget', 'Button'], function(widget, Button) {
    "use strict";

    var TabsTab = widget.createSubWidget('TabsTab', {
        tagName: 'li',
        init: function() {
            var changeCloseButton = function() {
                if(this.closeButton()) {
                    var button = this.getPart('closeButton');
                    if(!button) {
                        button = new Button({ title: 'X' });
                        this.setPart('closeButton', button);
                    }
                    //this.addClass('waf-' + this.kind.toLowerCase() + '-closable');
                    button.addClass('waf-tabs-closeTab');
                    button.removeClass('waf-button');
                } else {
                    this.setPart('closeButton', undefined);
                    //this.removeClass('waf-' + this.kind.toLowerCase() + '-closable');
                }
            };
            this.closeButton.onChange(changeCloseButton);
            changeCloseButton.call(this);

            var changeValue = function() {
                var button = this.getPart('closeButton');
                this.node.innerHTML = this.value();
                this.setPart('closeButton', button);
            };
            this.value.onChange(changeValue);
            changeValue.call(this);
        },
        value: widget.property({
            defaultValueCallback: function() {
                var button = this.getPart('closeButton');
                if(button) {
                    this.node.removeChild(button.node);
                }
                var value = this.node.innerHTML;
                if(button) {
                    this.node.appendChild(button.node);
                }
                return value;
            }
        }),
        closeButton: widget.property({
            type: 'boolean'
        })
    });
    TabsTab.inherit('waf-behavior/layout/composed');
    TabsTab.removeClass('waf-tabstab');

    TabsTab.mapDomEvents({ 'click': 'action' });

    TabsTab.setPart('closeButton');
    TabsTab.addProxiedEvent('action', 'closeButton', 'close');

    return TabsTab;
});
