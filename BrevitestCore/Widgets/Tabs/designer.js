(function(Tabs) {
    "use strict";

    Tabs.setWidth('500');
    Tabs.setHeight('400');

    Tabs.containerChildrenAreSubWidgets();

    Tabs.customizeProperty('menuPosition', {
        title: 'Menu position',
        display: true,
        sourceDisplay: false
    });

    Tabs.doAfter('init', function() {
        if(this.tabs.count()) return;
        this.tabs.push({ title: 'Tab 1' });
        this.tabs.push({ title: 'Tab 2' });
    });

    Tabs.addEvent('closeTab');
});
