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

