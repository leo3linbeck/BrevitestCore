WAF.define('CustomTextField', ['waf-core/widget'], function(widget) {

    var CustomTextField = widget.create('CustomTextField', {

        tagName: 'input',
        
        placeholder: widget.property({
            type: 'string',
            defaultValue: ''
        }),
        
        value: widget.property({
            type: 'string',
            defaultValue: ''
        }),

        init: function() {
            this.value.onChange(this.render);
            this.placeholder.onChange(this.render);
            
            var $el = $(this.node);
           	$el.on('change', function() {
           		var value = $el.val();
           		this.value(value);
           	}.bind(this));
           	
            this.render();
        },
        
        render: function() {
        	this.node.setAttribute('placeholder', this.placeholder());
        	this.node.value = this.value();
        }

    });

    return CustomTextField;

});
