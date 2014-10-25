(function(TabsTab) {
    "use strict";

    TabsTab.hideWidget();

    TabsTab.addState('selected');

    TabsTab.customizeProperty('closeButton', {
        title: 'Close button',
        display: true,
        sourceDisplay: false
    });

    TabsTab.customizeProperty('value', {
        display: true,
        sourceDisplay: false
    });

});
