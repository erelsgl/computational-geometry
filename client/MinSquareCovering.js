/**
 * Main Javascript program for MinSquareCovering.html
 */
var jsts = require("../lib");
var factory = new jsts.geom.GeometryFactory();

var _ = require("underscore");

$(document).ready(function() {
	
/* SQUARES */

function drawShapes(err, shapes) {
	for (var i in shapes) {
		var shape = shapes[i];
		var style = (shape.color? {fill:shape.color, stroke:shape.color}: shape);
		window.landplots.add(shape, style);
	}
	window.updateStatus();
	$(".interrupt").attr("disabled","disabled");
}

window.calcSimpleRectilinearPolygon = function(points) {
	var xy = [];
	for (var i=0; i<points.length; ++i) {
		xy.push(points[i].x)
		xy.push(points[i].y)
	}
	return new jsts.geom.SimpleRectilinearPolygon(xy);
}

window.calcMinSquareCovering = function(srp) {
	return jsts.algorithm.minSquareCovering(srp, factory);
}

}); // end of $(document).ready

