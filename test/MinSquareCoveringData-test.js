/**
 * a unit-test for the minimum square covering problem.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-03
 */

var should = require('should');
var _ = require('underscore');

var jsts = require("../lib");

var factory = new jsts.geom.GeometryFactory();

var South = jsts.Side.South;
var North = jsts.Side.North;
var East  = jsts.Side.East;
var West  = jsts.Side.West;
var Right = jsts.Turn.Right;
var Left = jsts.Turn.Left;

describe('square-covering structures', function() {
	var srp0 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([0,0, 10,10]));  // square
	var srp1 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([0,0, 10,20]));  // rectangle
	var srp2 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([-10,0, 0,10, 10,0, 20,20])); // ח shape
	var srp3 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([-10,0, 0,10, 10,0, 40,20])); // elongated ח shape
	var srp4 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([0,0,10,10,20,20])); // L-shape
	var srp5 = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([0,10, 20,0])); // L-shape
	
	it('calculates the convexity of corners', function() {
		srp1.corners.pluck("isConvex").should.eql([true,true,true,true]);
		srp2.corners.pluck("isConvex").should.eql([true,true,false,false,true,true,true,true]);
	})

	it('knows whether points are internal or external', function() {
		srp1.contains({x:5,y:10}).should.equal(true);   // internal
		srp1.contains({x:10,y:10}).should.equal(false); // boundary
		srp1.contains({x:16,y:10}).should.equal(false); // external
		
		srp3.contains({x:20,y:10}).should.equal(true);   // internal
		srp3.contains({x:50,y:10}).should.equal(false); // external
		srp3.contains({x:10,y:10}).should.equal(false); // boundary
	})
	
	it('finds closest segments', function() {
		var point1 = {x:5,y:10};
		srp1.findClosestSegment(East, point1).getX().should.equal(10);
		srp1.findClosestSegment(West, point1).getX().should.equal(0);
		srp1.findClosestSegment(North, point1).getY().should.equal(20);
		srp1.findClosestSegment(South, point1).getY().should.equal(0);

		var point2 = {x:-5,y:5};
		srp2.findClosestSegment(East, point2).getX().should.equal(0);
		srp2.findClosestSegment(West, point2).getX().should.equal(-10);
		srp2.findClosestSegment(North, point2).getY().should.equal(20);
		srp2.findClosestSegment(South, point2).getY().should.equal(0);

		var point3 = {x:15,y:5};
		srp2.findClosestSegment(East, point3).getX().should.equal(20);
		srp2.findClosestSegment(West, point3).getX().should.equal(10);
		srp2.findClosestSegment(North, point3).getY().should.equal(20);
		srp2.findClosestSegment(South, point3).getY().should.equal(0);
	})
	
	it('finds distance fromo segments to nearest corners', function() {
		var segment = srp2.segments.first;	
						       segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);

		var segment = srp3.segments.first;	
						       segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(Infinity); // no concave corner visible
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(30);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
		segment=segment.next;  segment.distanceToNearestConcaveCorner().should.equal(10);
	});

	it('finds distance from corners to nearest segments', function() {
		var corner = srp3.corners.first;	
		                    corner.distanceToNearestSegment(North).should.equal(20);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(10);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(10);   corner.distanceToNearestSegment(West).should.equal(10);
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(10);   corner.distanceToNearestSegment(East).should.equal(30); 
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20); 
		corner=corner.next; corner.distanceToNearestSegment(North).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(30); 
		corner=corner.next; corner.distanceToNearestSegment(South).should.equal(20);   corner.distanceToNearestSegment(West).should.equal(50); 
		corner=corner.next; corner.distanceToNearestSegment(South).should.equal(20);   corner.distanceToNearestSegment(East).should.equal(50); 
	})

	it('finds distance from segments to nearest borders', function() {
		var segment = srp3.segments.first;	
		                       segment.distanceToNearestBorder().should.equal(20);
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(20);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(30);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(10);
		segment=segment.next;  segment.distanceToNearestBorder().should.equal(10);
	})
	
	it('finds continuators', function() {
		var srp = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([10,10, 30,30, 15,25]));  // L-shape
		srp.findContinuatorSegment().length().should.equal(15);
		
		var srp = new jsts.algorithm.MinSquareCoveringData(factory.createSimpleRectilinearPolygon([0,0, 20,20, 0,15, 15,5]));  // U-shape
		srp.findContinuatorSegment().length().should.equal(5);
	})

	it('removes erasable regions in rectangles', function () {
		var srpBase = new jsts.geom.SimpleRectilinearPolygon([0,0, 10,35], factory);
		
		var srp = new jsts.algorithm.MinSquareCoveringData(srpBase);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([00,00,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([10,10,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([20,20,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([25,25,35,35]);
		
		var srp = new jsts.algorithm.MinSquareCoveringData(srpBase);
		srp.removeErasableRegion(srp.segments.first.next.next);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([00,00,25,25]);
		srp.removeErasableRegion(srp.segments.first.next.next);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([00,00,15,15]);
		srp.removeErasableRegion(srp.segments.first.next.next);
		srp.corners.pluck("x").should.eql([00,10,10,00]);
		srp.corners.pluck("y").should.eql([00,00,10,10]);
		
		var srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([0,5, 20,20], factory));
		srp.corners.pluck("x").should.eql([00,20,20,00]);
		srp.corners.pluck("y").should.eql([05,05,20,20]);
//		console.log("0: "+srp)
		srp.removeErasableRegion(srp.segments.first.next);
//		console.log("1: "+srp)
		srp.corners.pluck("x").should.eql([00,15,15,00]);
		srp.corners.pluck("y").should.eql([05,05,20,20]);
		
	});

	it('removes erasable regions in L-shapes', function () {
		var srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([0,0, 10,25, 20,35], factory));
		srp.corners.pluck("x").should.eql([0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([0, 0,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([ 0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([10,10,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([ 0,10,10,20,20, 0]);
		srp.corners.pluck("y").should.eql([20,20,25,25,35,35]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([ 0,20,20, 0]);
		srp.corners.pluck("y").should.eql([25,25,35,35]);

		srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([10,0, 20,35, 0,25], factory));
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([ 0, 0,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([10,10,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([10,20,20, 0, 0,10]);
		srp.corners.pluck("y").should.eql([20,20,35,35,25,25]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([20,20, 0, 0]);
		srp.corners.pluck("y").should.eql([25,35,35,25]);

	
		srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([10,0, 20,20, 0,10], factory));
		srp.corners.pluck("x").should.eql([10,20,20,00,00,10]);
		srp.corners.pluck("y").should.eql([00,00,20,20,10,10]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([20,20,0,0]);
		srp.corners.pluck("y").should.eql([10,20,20,10]);
		srp.removeErasableRegion(srp.segments.first);
		srp.corners.pluck("x").should.eql([10,10,0,0]);
		srp.corners.pluck("y").should.eql([10,20,20,10]);
		
	});

	it('removes erasable regions in T-shapes', function () {
		var srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([0,10, 25,0, 35,30, 25,20], factory));
		srp.corners.pluck("x").should.eql([00,25,25,35,35,25,25,00]);
		srp.corners.pluck("y").should.eql([10,10,00,00,30,30,20,20]);
		srp.removeErasableRegion(srp.segments.last);
		srp.corners.pluck("x").should.eql([10,25,25,35,35,25,25,10]);
		srp.corners.pluck("y").should.eql([10,10,00,00,30,30,20,20]);
		srp.removeErasableRegion(srp.segments.last);
		srp.corners.pluck("x").should.eql([20,25,25,35,35,25,25,20]);
		srp.corners.pluck("y").should.eql([10,10,00,00,30,30,20,20]);
		srp.removeErasableRegion(srp.segments.last);
		srp.corners.pluck("x").should.eql([25,35,35,25]);
		srp.corners.pluck("y").should.eql([00,00,30,30]);
	});

	it('removes erasable regions with 3-knob continuators', function () {
		var srp = new jsts.algorithm.MinSquareCoveringData(new jsts.geom.SimpleRectilinearPolygon([0,0, 40,40, 30,50, 40,90, 0,50, 10,40], factory));
		srp.corners.pluck("x").should.eql([00,40,40,30,30,40,40,00,00,10,10,00]);
		srp.corners.pluck("y").should.eql([00,00,40,40,50,50,90,90,50,50,40,40]);
		srp.removeErasableRegion(srp.segments.last, 3 /* knobs */);
		srp.corners.pluck("x").should.eql([10,30,30,40,40,00,00,10]);
		srp.corners.pluck("y").should.eql([40,40,50,50,90,90,50,50]);
	});

	
	
	

	it('finds continuator segments', function() {
		srp0.findContinuatorSegment().knobCount.should.equal(4);
		srp1.findContinuatorSegment().knobCount.should.equal(1);
		srp4.findContinuatorSegment().knobCount.should.equal(1);
	})


	it('finds continuators', function() {
		var segment;
		
		segment = srp0.segments.first; segment.continuator().should.eql({minx:0,maxx:10,miny:0,maxy:10}); 
		segment = segment.next;	       segment.continuator().should.eql({minx:0,maxx:10,miny:0,maxy:10}); 
		segment = segment.next;	       segment.continuator().should.eql({minx:0,maxx:10,miny:0,maxy:10}); 
		segment = segment.next;	       segment.continuator().should.eql({minx:0,maxx:10,miny:0,maxy:10}); 
		
		segment = srp1.segments.first; segment.continuator().should.eql({minx:0,maxx:10,miny:0,maxy:10}); 
		segment = segment.next.next;   segment.continuator().should.eql({minx:0,maxx:10,miny:10,maxy:20}); 
		
		segment = srp3.segments.first;	           segment.continuator().should.eql({minx:-10,maxx:0,miny:0,maxy:10});
		segment=segment.next.next.next.next.next;  segment.continuator().should.eql({minx:20,maxx:40,miny:0,maxy:20});
	});
});
