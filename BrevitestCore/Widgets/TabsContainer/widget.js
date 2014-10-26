WAF.define('TabsContainer', ['waf-core/widget'], function(widget) {
    "use strict";

    var TabsContainer = widget.createSubWidget('TabsContainer');
    TabsContainer.inherit('waf-behavior/layout/container');
    TabsContainer.addClass('waf-ui-box');

    return TabsContainer;
});
