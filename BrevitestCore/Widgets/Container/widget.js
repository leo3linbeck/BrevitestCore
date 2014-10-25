WAF.define('Container', ['waf-core/widget'], function(widget) {
    "use strict";

    var Container = widget.create('Container');
    Container.inherit(WAF.require('waf-behavior/layout/container'));

    return Container;
});
