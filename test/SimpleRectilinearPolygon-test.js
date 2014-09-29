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
	
	it('initializes from minimal set of xy values', function() {
		srp1.getCoordinates().should.eql(
			[ { x: 0, y: 0}, { x: 10, y: 0}, { x: 10, y: 20}, { x: 0, y: 20},  { x: 0, y: 0} ]);
		srp2.points.should.eql(
			[{x:-10,y:0}, {x:0,y:0}, {x:0,y:10}, {x:10,y:10},{x:10,y:0}, {x:20,y:0}, {x:20,y:20}, {x:-10,y:20}, {x:-10,y:0}]);
	})
	
	it ('knows what points it contains', function() {
		var point1 = factory.createPoint(5,5);
		var point2 = factory.createPoint(10,10);
		var point3 = factory.createPoint(15,15);
		var point4 = factory.createPoint(20,20);

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
});


describe('SimpleRectilinearPolygon removeRectangle from a square', function() {
	jsts.geom.SimpleRectilinearPolygon.FORCE_FIRST_SEGMENT_HORIZONTAL = false;
	var land = factory.createSimpleRectilinearPolygon([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	it('SW corner', function() {
		land.removeRectangle({minx:0,miny:0, maxx:2,maxy:3}).points.should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3},{x:0,y:10}]);
	});
	it('west wall', function() {
		land.removeRectangle({minx:0,miny:1, maxx:2,maxy:3}).points.should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:3},{x:0,y:3},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire west wall', function() {
		land.removeRectangle({minx:0,miny:0, maxx:2,maxy:10}).points.should.eql([{x:10,y:10},{x:10,y:0},{y:0,x:2},{y:10,x:2},{x:10,y:10}]);
	});
	it('NW corner', function() {
		land.removeRectangle({minx:0,miny:1, maxx:2,maxy:10}).points.should.eql([{x:0,y:0},{x:0,y:1},{x:2,y:1},{x:2,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('north wall', function() {
		land.removeRectangle({minx:1,miny:1, maxx:9,maxy:10}).points.should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:9,y:1},{x:9,y:10},{x:10,y:10},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire north wall', function() {
		land.removeRectangle({minx:0,miny:1, maxx:10,maxy:10}).points.should.eql([{x:0,y:0},{x:0,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('NE corner', function() {
		land.removeRectangle({minx:1,miny:1, maxx:10,maxy:10}).points.should.eql([{x:0,y:0},{x:0,y:10},{x:1,y:10},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('east wall', function() {
		land.removeRectangle({minx:1,miny:1, maxx:10,maxy:9}).points.should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:9},{x:1,y:9},{x:1,y:1},{x:10,y:1},{x:10,y:0},{x:0,y:0}]);
	});
	it('entire east wall', function() {
		land.removeRectangle({minx:1,miny:0, maxx:10,maxy:10}).points.should.eql([{x:0,y:0},{x:0,y:10},{y:10,x:1},{y:0,x:1},{x:0,y:0}]);
	});
	it('SE corner', function() {
		land.removeRectangle({minx:1,miny:0, maxx:10,maxy:3}).points.should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('south wall', function() {
		land.removeRectangle({minx:1,miny:0, maxx:8,maxy:3}).points.should.eql([{x:0,y:0},{x:0,y:10},{x:10,y:10},{x:10,y:0},{x:8,y:0},{x:8,y:3},{x:1,y:3},{x:1,y:0},{x:0,y:0}]);
	});
	it('entire south wall', function() {
		land.removeRectangle({minx:0,miny:0, maxx:10,maxy:3}).points.should.eql([{x:0,y:10},{x:10,y:10},{x:10,y:3},{x:0,y:3},{x:0,y:10}]);
	});
	
	it('result is not simply-connected', function() {
		(function() {land.removeRectangle({minx:4,miny:4, maxx:6,maxy:6})}).should.throw();
	})
});



describe('SimpleRectilinearPolygon removeRectangle from an L-shape', function() {
	var land = factory.createSimpleRectilinearPolygon([0,0, 18,2, 20,20]);
	it('L-shape becomes rectangle', function() {
		land.removeRectangle({minx:0,miny:0, maxx:18,maxy:2}).points.should.eql([{x:20,y:2},{x:20,y:20},{x:0,y:20},{x:0,y:2},{x:20,y:2}]);
	});
	it('L-shape remains L-shape', function() {
		land.removeRectangle({minx:0,miny:0, maxx:18,maxy:1}).points.should.eql([{x:18,y:2},{x:20,y:2},{x:20,y:20},{x:0,y:20},{x:0,y:1},{x:18,y:1},{x:18,y:2}]);
	});
	
	var land2 = factory.createSimpleRectilinearPolygon([0,69, 31,100, 100,0]);
	it('L-shape becomes U-shape', function() {
		land2.removeRectangle({minx:31,miny:66, maxx:65,maxy:100}).points.should.eql(
				[{x:0,y:69},{x:31,y:69},{x:31,y:66},{x:65,y:66},{x:65,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0},{x:0,y:69}]);
	});
	
	var land3 = factory.createSimpleRectilinearPolygon([0,68, 32,100, 100,0]);
	it('L-shape remains L-shape 2', function() {
		land3.removeRectangle({minx:32,miny:68, maxx:64,maxy:100}).points.should.eql(
				[{x:0,y:68},{x:64,y:68},{x:64,y:100},{x:100,y:100},{x:100,y:0},{x:0,y:0},{x:0,y:68}]);
	});

	it('result is not simply-connected A', function() {
		(function() {land3.removeRectangle({minx:50,miny:30, maxx:60,maxy:40})}).should.throw();

	})
	it('result is not simply-connected B', function() {
		var land4 = factory.createSimpleRectilinearPolygon([0,0, 20,10, 30,30]);
		(function() {land4.removeRectangle({"minx":18,"maxx":20,"miny":18,"maxy":20})}).should.throw();
	})
});




