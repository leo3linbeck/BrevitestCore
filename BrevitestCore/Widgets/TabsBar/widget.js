WAF.define('TabsBar', ['waf-core/widget', 'TabsTab'], function(widget, TabsTab) {
    "use strict";

    var TabsBar = widget.createSubWidget('TabsBar', {
        tagName: 'ul'
    });
    TabsBar.inherit(WAF.require('waf-behavior/layout/container'));
    TabsBar.inherit(WAF.require('waf-behavior/layout/properties-container'));
    TabsBar.removeClass('waf-tabview2bar');

    TabsBar.addProperty('items', {
        type: 'list',
        attributes: [{
            name: 'value',
            defaultValueCallback: function() {
                return 'Item ' + (this.items.count() + 1);
            }
        }, {
            name: 'closeButton',
            type: 'boolean'
        }]
    });
    TabsBar.linkListPropertyToContainer('items');

    // TabsBar.optionsParsers['close-button'] = function() {
    //     this.invoke('changeOption', 'close-button', this.options['close-button']);
    // };

    TabsBar.prototype.select = function(index) {
        var widget = this.widget(index);
        if(!widget) {
            return;
        }
        this.invoke('removeClass', 'waf-state-selected');
        widget.addClass('waf-state-selected');
        this.fire('select', { widget: widget, index: index });
    };

    TabsBar.restrictWidget(TabsTab);

    TabsBar.addIndexedEvent('action', 'select');
    TabsBar.addIndexedEvent('close');

    return TabsBar;
});
