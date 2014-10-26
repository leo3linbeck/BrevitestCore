WAF.define('Tabs', ['waf-core/widget', 'TabsBar', 'TabsContainer'], function(widget, TabsBar, TabsContainer) {
    "use strict";

    var Tabs = widget.create('Tabs');
    Tabs.inherit('waf-behavior/layout/container');
    Tabs.inherit('waf-behavior/layout/composed');
    Tabs.inherit('waf-behavior/layout/properties-container');

    Tabs.addProperty('menuPosition', {
        type: 'enum',
        values: {
            'waf-tabs-topLeft':     'top-left',
            'waf-tabs-topRight':    'top-right',
            'waf-tabs-leftTop':     'left-top',
            'waf-tabs-leftBottom':  'left-bottom',
            'waf-tabs-bottomLeft':  'bottom-left',
            'waf-tabs-bottomRight': 'bottom-right',
            'waf-tabs-rightTop':    'right-top',
            'waf-tabs-rightBottom': 'right-bottom'
        },
        onChange: function(value, oldValue) {
            this.removeClass(oldValue);
            this.addClass(value);
        },
        defaultValueCallback: function() {
            var m = /waf-tabs-(top|left|bottom|right)(Left|Right|Top|bottom)/.exec(this.node.className);
            if(m) {
                return m[0];
            }
            return 'waf-tabs-topLeft';
        }
    });

    Tabs.setPart('menubar', TabsBar);

    Tabs.addProperty('tabs', {
        type: 'list',
        attributes: [{
            name: 'title',
            type: 'string',
            defaultValueCallback: function() {
                return 'Tab ' + (this.tabs.count() + 1);
            }
        }, {
            name: 'closeButton',
            type: 'boolean'
        }]
    });
    Tabs.linkListPropertyToContainer('tabs');

    Tabs.prototype.init = function() {
        // force the default position css class
        this.addClass(this.menuPosition());

        var menubar = this.getPart('menubar');
        this._menubarSelectSubscriber = menubar.subscribe('select', function(event) {
            this.currentContainerIndex(event.data.index);
        }, this);

        menubar.subscribe('close', function(event) {
            this.removeWidget(event.data.index);
        }, this);

        //synhronise tabs with items
        this.tabs.onInsert(function(data) {
            var item = this.tabs(data.index);
            menubar.items.insert(data.index, {
                value: item.title,
                closeButton: item.closeButton
            });
            if(menubar.items.count() === 1) {
                this.currentContainerIndex(0);
            }
        });
        this.tabs.onRemove(function(data) {
            menubar.items.remove(data.index);
            if(menubar.items.count() && this.currentContainerIndex() === data.index) {
                var index = data.index;
                if(index >= menubar.items.count()) {
                    index--;
                }
                this.currentContainerIndex(index);
            }
        });
        this.tabs.onMove(function(data) {
            menubar.items.move(data.from, data.to);
        });
        this.tabs.onModify(function(data) {
            var item = this.tabs(data.index);
            menubar.items(data.index, {
                value: item.title,
                closeButton: item.closeButton
            });
        });

        if (this.countWidgets() > 0 && this.currentContainerIndex() === undefined) {
            this.currentContainerIndex(0);
        }
    };

    /**
     * Allow to choose the current page
     * This API will part of the futur multicontainer behavior
     * @param {integer} [index] - the index of the container to set as current
     * @returns {integer} - The index of the current active container
     */
    Tabs.prototype.currentContainerIndex = function(index) {
        if(typeof index === 'number') {
            if(index < 0 || index >= this._children.length) {
                throw "Container not found";
            }
            this.invoke('removeClass', 'waf-state-active');
            this._currentContainer = index;
            this._children[this._currentContainer].addClass('waf-state-active');
            this.fire('select', { index: index, widget: this._children[this._currentContainer] });

            this._menubarSelectSubscriber.pause();
            this.getPart('menubar').select(index);
            this._menubarSelectSubscriber.resume();
        }
        return this._currentContainer;
    };

    /**
     * Set the current container as the last inserted or appended container
     * This API will part of the futur multicontainer behavior
     */
    Tabs.prototype.setLastContainerAsCurrent = function() {
        this.currentContainerIndex(this._lastWidgetIndex);
    };

    Tabs.restrictWidget(TabsContainer);

    return Tabs;
});
