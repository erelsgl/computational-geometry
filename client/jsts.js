/**
 * Main Javascript program for MinSquareCovering.html
 */
var jsts = require("../lib");
var factory = new jsts.geom.GeometryFactory();

var _ = require("underscore");

$(document).ready(function() {
	
/* SQUARES */

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

window.calcShapesTouchingPoints = function(shapeName, points, walls) {
	var candidates = factory.createShapesTouchingPoints(
		shapeName, points, new jsts.geom.Envelope(walls));
	console.dir(jsts.stringify(candidates));
	return candidates;
}

window.calcMaxDisjointSet = function(candidates, stopAtCount) {
	return jsts.algorithm.maximumDisjointSet(candidates, stopAtCount);
}

window.getMaxDisjointSetSolver = function(candidates, stopAtCount) {
	return new jsts.algorithm.MaximumDisjointSetSolver(candidates, stopAtCount);
}

window.calcRepresentativeDisjointSet = function(candidateSets) {
	return jsts.algorithm.representativeDisjointSet	(candidateSets)
}


}); // end of $(document).ready

