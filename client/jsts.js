/**
 * Main Javascript program for MinSquareCovering.html
 */
var jsts = window.jsts = require("../jsts-extended");
var _ = window._ = require("underscore");

var factory = new jsts.geom.GeometryFactory();

$(document).ready(function() {
	
/* SQUARES */

window.calcSimpleRectilinearPolygon = function(points) {
	var xy = [];
	for (var i=0; i<points.length; ++i) {
		xy.push(points[i].x)
		xy.push(points[i].y)
	}
	return factory.createSimpleRectilinearPolygon(xy);
}

window.calcMinSquareCovering = function(srp) {
	return jsts.algorithm.minSquareCovering(srp, factory);
}

window.calcShapesTouchingPoints = function(shapeName, points, walls) {
	var candidates = factory.createShapesTouchingPoints(
		shapeName, points, new jsts.geom.Envelope(walls.minx,walls.maxx, walls.miny,walls.maxy));
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

window.calcHalfProportionalDivision = function(pointsPerAgent, envelopeTemp, maxSlimness) {
	return factory.createHalfProportionalDivision(
			pointsPerAgent, envelopeTemp, maxSlimness);
}


}); // end of $(document).ready

