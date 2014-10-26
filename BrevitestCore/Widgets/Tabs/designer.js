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

});
