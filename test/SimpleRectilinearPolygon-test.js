#!mocha
/**
 * a unit-test for SimpleRectilinearPolygon class.
 *
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var _ = require('underscore');

var jsts = require("../lib");

var factory = new jsts.geom.GeometryFactory();

describe('SimpleRectilinearPolygon', function() {
	var srp0 = factory.createSimpleRectilinearPolygon([0,0, 10,10]);  // square
	var srp1 = factory.createSimpleRectilinearPolygon([0,0, 10,20]);  // rectangle
	var srp2 = factory.createSimpleRectilinearPolygon([-10,0, 0,10, 10,0, 20,20]); // ח shape
	var srp3 = factory.createSimpleRectilinearPolygon([-10,0, 0,10, 10,0, 40,20]); // elongated ח shape
	var srp4 = factory.createSimpleRectilinearPolygon([0,0,10,10,20,20]); // L-shape
	var srp_empty = null

	it('initialized from empty set of points', function() {
		srp_empty = factory.createSimpleRectilinearPolygon([0,0]);
	});

	it('initializes from minimal set of xy values', function() {
		srp1.getCoordinates2D().should.eql(
			[ { x: 0, y: 0}, { x: 10, y: 0}, { x: 10, y: 20}, { x: 0, y: 20},  { x: 0, y: 0} ]);
		srp2.getCoordinates2D().should.eql(
			[{x:-10,y:0}, {x:0,y:0}, {x:0,y:10}, {x:10,y:10},{x:10,y:0}, {x:20,y:0}, {x:20,y:20}, {x:-10,y:20}, {x:-10,y:0}]);
	})

	it('knows what points it contains', function() {
		var point1 = factory.createPointFromXY(5,5);
		var point2 = factory.createPointFromXY(10,10);
		var point3 = factory.createPointFromXY(15,15);
		var point4 = factory.createPointFromXY(20,20);

		srp0.contains(point1).should.equal(true);
		srp0.contains(point2).should.equal(false); // boundary not contained
		point3.within(srp0).should.equal(false);
		point4.within(srp0).should.equal(false);

		srp1.contains(point1).should.equal(true);
		srp1.contains(point2).should.equal(false); // boundary not contained
		point3.within(srp1).should.equal(false);
		point4.within(srp1).should.equal(false);

		srp2.contains(point1).should.equal(false);
		srp2.contains(point2).should.equal(false); // boundary not contained
		point3.within(srp2).should.equal(true);
		point4.within(srp2).should.equal(false);
	})

	it ('detects self-intersections', function() {
		srp0.selfIntersectionPoints().length.should.equal(0);
		srp1.selfIntersectionPoints().length.should.equal(0);
		srp2.selfIntersectionPoints().length.should.equal(0);
		srp3.selfIntersectionPoints().length.should.equal(0);
		srp4.selfIntersectionPoints().length.should.equal(0);

		srp8 = factory.createSimpleRectilinearPolygon([0,0,10,20,20,10]);
		srp8.selfIntersectionPoints().should.eql([[10,10]]);

		srpx = factory.createSimpleRectilinearPolygon([0,1, 1,0.5325, 0.7150000000000001,0.2475, 1,0.20750000000000002, 0.7925,0.2475, 1,0.5325, 0.7150000000000001,0.2475, 0.5449999999999999,0]);
		srpx.selfIntersectionPoints().length.should.equal(1);
	})
});


describe('SimpleRectilinearPolygon removeRectangle from a square:', function() {
	jsts.geom.SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL = false;
	var land = factory.createSimpleRectilinearPolygon([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	it('SW corner', function() {
		land.removeRectangle({minx:0,miny:0, maxx:2,maxy:3}).getCoordinates2D().should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3},{x:0,y:10}]);
	});
	it('west wall', function() {
		land.removeRectangle({minx:0,miny:1, maxx:2,maxy:3}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:3},{x:0,y:3},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire west wall', function() {
		land.removeRectangle({minx:0,miny:0, maxx:2,maxy:10}).getCoordinates2D().should.eql([{x:10,y:10},{x:10,y:0},{y:0,x:2},{y:10,x:2},{x:10,y:10}]);
	});
	it('NW corner', function() {
		land.removeRectangle({minx:0,miny:1, maxx:2,maxy:10}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('north wall', function() {
		land.removeRectangle({minx:1,miny:1, maxx:9,maxy:10}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:9,y:1},{x:9,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire north wall', function() {
		land.removeRectangle({minx:0,miny:1, maxx:10,maxy:10}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('NE corner', function() {
		land.removeRectangle({minx:1,miny:1, maxx:10,maxy:10}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('east wall', function() {
		land.removeRectangle({minx:1,miny:1, maxx:10,maxy:9}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:9},{x:1,y:9},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire east wall', function() {
		land.removeRectangle({minx:1,miny:0, maxx:10,maxy:10}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{y:10,x:1},{y:0,x:1},{x:0,y:0}]);
	});
	it('SE corner', function() {
		land.removeRectangle({minx:1,miny:0, maxx:10,maxy:3}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('south wall', function() {
		land.removeRectangle({minx:1,miny:0, maxx:8,maxy:3}).getCoordinates2D().should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:8,y:0},{x:8,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('entire south wall', function() {
		land.removeRectangle({minx:0,miny:0, maxx:10,maxy:3}).getCoordinates2D().should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:0,y:3},{x:0,y:10}]);
	});

	it('result is not simply-connected', function() {
		(function() {land.removeRectangle({minx:4,miny:4, maxx:6,maxy:6})}).should.throw();
	})
});



describe('SimpleRectilinearPolygon removeRectangle from an L-shape', function() {
	it('L-shape becomes rectangle', function() {
		var land = factory.createSimpleRectilinearPolygon([0,0, 18,2, 20,20]);
		land.removeRectangle({minx:0,miny:0, maxx:18,maxy:2}).getCoordinates2D().should.eql([{x:20,y:2},{x:20,y:20},{x:0,y:20},{x:0,y:2},{x:20,y:2}]);
	});
	it('L-shape remains L-shape', function() {
		var land = factory.createSimpleRectilinearPolygon([0,0, 18,2, 20,20]);
		land.removeRectangle({minx:0,miny:0, maxx:18,maxy:1}).getCoordinates2D().should.eql([{x:18,y:2},{x:20,y:2},{x:20,y:20},{x:0,y:20},{x:0,y:1},{x:18,y:1},{x:18,y:2}]);
	});

	it('L-shape becomes U-shape', function() {
		var land2 = factory.createSimpleRectilinearPolygon([0,69, 31,100, 100,0]);
		land2.removeRectangle({minx:31,miny:66, maxx:65,maxy:100}).getCoordinates2D().should.eql(
				[{x:0,y:69},{x:31,y:69},{x:31,y:66},{x:65,y:66},{x:65,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0},{x:0,y:69}]);
	});

	it('L-shape remains L-shape 2', function() {
		var land3 = factory.createSimpleRectilinearPolygon([0,68, 32,100, 100,0]);
		land3.removeRectangle({minx:32,miny:68, maxx:64,maxy:100}).getCoordinates2D().should.eql(
				[{x:0,y:68},{x:64,y:68},{x:64,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0},{x:0,y:68}]);
	});

	it('result is not simply-connected A', function() {
		var land3 = factory.createSimpleRectilinearPolygon([0,68, 32,100, 100,0]);
		(function() {land3.removeRectangle({minx:50,miny:30, maxx:60,maxy:40})}).should.throw(/not adjacent to border/);

	})
	it('result is not simply-connected B', function() {
		var land4 = factory.createSimpleRectilinearPolygon([0,0, 20,10, 30,30]);
		(function() {land4.removeRectangle({minx:18,maxx:20, miny:18,maxy:20})}).should.throw(/not adjacent to border/);
	})

	it('result is not connected A', function() {
		var land5 = factory.createSimpleRectilinearPolygon([0,0, 20,20, 60,60]);
		(function() {land5.removeRectangle({minx:0,maxx:30, miny:20,maxy:50})}).should.throw(/disconnected/);
	})

	it('result is not connected B', function() {
		var land6 = factory.createSimpleRectilinearPolygon([0,1, 1,0.20750000000000002, 0.7925,0.2475, 0.5449999999999999,0]);
		(function() {land6.removeRectangle({"minx":0.7150000000000001,"miny":0.2475,"maxx":1,"maxy":0.5325})}).should.throw(/disconnected/);
	})
});


describe('SimpleRectilinearPolygon removeRectangle from complex shapes', function() {
});
