/**
 * Add a color field to a list of objects.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var _ = require("underscore");

var colors = ['#000','#f00','#0f0','#ff0','#088','#808','#880'];
var color = function(i) {return colors[i % colors.length]};

module.exports = {
	color: color,

	/**
	 * Duplicate a given object a given number of times, adding a "color" field to each copy.
	 *
	 * @param object
	 * @param count
	 * @return an array with objects similar to "object" but with an added color field.
	 */
	rainbowDuplicate: function(object,count) {
		var rainbow = [];
		for (var i=0; i<count; ++i) {
			var newObject = _.clone(object);
			newObject.color = color(i);
			rainbow.push(newObject);
		}
		return rainbow;
	}
};
