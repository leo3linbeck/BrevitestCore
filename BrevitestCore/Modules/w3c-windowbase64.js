﻿/** * Base64 utility methods (HTML5 section 6.2) * * Provides the WindowBase64 interface * You might use it directly from the module itself or apply it to any other object * * ex:  * // Implements the WindowBase64 on the global object * require('w3c-html5-windowbase64').WindowBase64.apply(this); *  * * The atob() and btoa() methods allow authors to transform content to and from the base64 encoding. * * In these APIs, for mnemonic purposes, the "b" can be considered to stand for "binary",  * and the "a" for "ASCII". In practice, though, for primarily historical reasons,  * both the input and output of these functions are Unicode strings. * * @module w3c-html5-windowbase64 * @see http://www.w3.org/TR/html5/webappapis.html#atob **/var	REGEX_ATOB,	DOMException,	CODE_INVALID_CHARACTER_ERROR,	NAME_INVALID_CHARACTER_ERROR,	MESSAGE_INVALID_CHARACTER_ERROR,	InvalidCharacterError;/** * @private * @property REGEX_ATOB * @type RegExp **/REGEX_ATOB = /[+\/=0-9A-Za-z]/g;CODE_INVALID_CHARACTER_ERROR = 5;NAME_INVALID_CHARACTER_ERROR = 'InvalidCharacterError'MESSAGE_INVALID_CHARACTER_ERROR = "The string contains invalid characters.";if (!DOMException) {	// Server-Side context	DOMException = require('./lib/w3c-domcore-errors').DOMException;	InvalidCharacterError = new DOMException(NAME_INVALID_CHARACTER_ERROR);} else {	// Browser context	if (typeof DOMError === 'function') {		// DOMError available as a constructor as specified in WHATWG DOM Core edition		// http://dom.spec.whatwg.org/#domerror		try {			InvalidCharacterError = new DOMError(NAME_INVALID_CHARACTER_ERROR, MESSAGE_INVALID_CHARACTER_ERROR);		} catch (e) {}	}	if (!InvalidCharacterError) {		InvalidCharacterError = new Error(MESSAGE_INVALID_CHARACTER_ERROR);		InvalidCharacterError.name = NAME_INVALID_CHARACTER_ERROR;	}	InvalidCharacterError.code = CODE_INVALID_CHARACTER_ERROR;	InvalidCharacterError.constructor = DOMException;}function btoa(data) {	var		buffer;	buffer = new Buffer(data);	return buffer.toString('base64');} function atob(data) {	var		buffer;	if (!REGEX_ATOB.test(data)) {		throw InvalidCharacterError;	}	buffer = new Buffer(data, 'base64');	return buffer.toString();}/** * @interface WindowBase64 **/function WindowBase64() {	/**	 * Takes the input data, in the form of a Unicode string containing only characters in the range U+0000 to U+00FF, 	 * each representing a binary byte with values 0x00 to 0xFF respectively, and converts it to its base64 representation, 	 * which it returns.	 *	 * @method btoa	 * @param {DOMString} data	 * @throw {DOMException} InvalidCharacterError exception if the input string contains any out-of-range characters.	 * @return {DOMString}	 **/	this.btoa = btoa;	/**	 * Takes the input data, in the form of a Unicode string containing base64-encoded binary data,	 * decodes it, and returns a string consisting of characters in the range U+0000 to U+00FF, 	 * each representing a binary byte with values 0x00 to 0xFF respectively, corresponding to that binary data.	 *	 * @method atob	 * @param {DOMString} data	 * @return {DOMString}	 **/	this.atob = atob;}exports.WindowBase64 = WindowBase64;WindowBase64.apply(exports);