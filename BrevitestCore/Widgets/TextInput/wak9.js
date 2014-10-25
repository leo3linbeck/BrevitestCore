(function() {
    "use strict";

    WAF.utils.getNumberFormatCodes = function(locale) {
        var dec = ".";
        var group = ",";
        var neg = "-";

        if (locale === "us" ||
            locale === "ae" ||
            locale === "eg" ||
            locale === "il" ||
            locale === "jp" ||
            locale === "sk" ||
            locale === "th" ||
            locale === "cn" ||
            locale === "hk" ||
            locale === "tw" ||
            locale === "au" ||
            locale === "ca" ||
            locale === "gb" ||
            locale === "in"
        ) {
            dec = ".";
            group = ",";
        } else if (locale === "de" ||
            locale === "vn" ||
            locale === "es" ||
            locale === "dk" ||
            locale === "at" ||
            locale === "gr" ||
            locale === "br"
        ) {
            dec = ",";
            group = ".";
        } else if (locale === "cz" ||
            locale === "fr" ||
            locale === "fi" ||
            locale === "ru" ||
            locale === "se"
        ) {
            group = " ";
            dec = ",";
        } else if (locale === "ch") {
            group = "'";
            dec = ".";
        }

        return {
            dec: dec,
            group: group,
            neg: neg
        };
    };

    WAF.utils.parseNumber = function(value, options) {
        options = options || {};
        if(typeof options === 'string') {
            options = { format: options };
        }
        options.locale = options.locale || WAF.utils.getBrowserLang();

        var code = WAF.utils.getNumberFormatCodes(options.locale);

        value = value.split(code.group).join('');
        value = value.replace(/^ */, '').replace(/ *$/, '');
        value = value.replace(code.dec, '.').replace(code.neg, '-');

        // if(/^[\-+]?([0-9]*\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE]-?[0-9]+)$/.test(value)) {
        if(!/^[\-+]?([0-9]*\.[0-9]+|[0-9]+(\.[0-9]*)?)$/.test(value)) {
            throw 'Invalid number';
        }
        return parseFloat(value);
    };

    WAF.utils.parseDate = function(value, options) {
        options = options || {};
        if(typeof options === 'string') {
            options = { format: options };
        }
        options.locale = options.locale || WAF.utils.getBrowserLang();

        var settings;
        if (options.locale != null) {
            if (options.locale === "us" || options.locale === "en") {
                options.locale = '';
            }
            settings = $.datepicker.regional[options.locale];
            if (settings) {
                options.format = options.format || settings.dateFormat;
            }
        }

        options.format = options.format || "mm/dd/yy";

        return $.datepicker.parseDate(options.format, value, settings);
    };

})();
