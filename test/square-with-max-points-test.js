#!mocha
/**
 * a unit-test for square-with-max-points
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../lib");
var squareWithMaxNumOfPoints = jsts.algorithm.squareWithMaxNumOfPoints; // shorthand

var square = {minx:0,maxx:400,miny:0,maxy:400}
var fatrect1 = {minx:0,maxx:300,miny:0,maxy:400} // a 2-fat rectangle
var fatrect2 = {minx:0,maxx:400,miny:0,maxy:200} // a 2-fat rectangle
var thinrect1 = {minx:0,maxx:100,miny:0,maxy:400} // a 4-fat rectangle
var thinrect2 = {minx:0,maxx:400,miny:0,maxy:90} // a 4-thin rectangle

describe('square-with-max-points in simple cases', function() {
	it('works with an empty list of points', function() {
		squareWithMaxNumOfPoints([],square).should.eql({minx:0,maxx:400,miny:0,maxy:400});
		squareWithMaxNumOfPoints([],thinrect1).should.eql({minx:0,maxx:100,miny:0,maxy:100});
	})
	it('works with a single point inside the envelope', function() {
		squareWithMaxNumOfPoints([{x:0,y:0}],square).should.eql({minx:0,maxx:400,miny:0,maxy:400});
		squareWithMaxNumOfPoints([{x:100,y:100}],thinrect1).should.eql({minx:0,maxx:100,miny:100,maxy:200});
	})
	it('works with a single point outside the envelope', function() {
		squareWithMaxNumOfPoints([{x:500,y:500}],square).should.eql({minx:0,maxx:400,miny:0,maxy:400});
		squareWithMaxNumOfPoints([{x:-100,y:-100}],thinrect1).should.eql({minx:0,maxx:100,miny:0,maxy:100});
	})
})

describe('square-with-max-points with points with exponential distances', function() {
	var pointsy = [{x:0,y:0},{x:0,y:200},{x:0,y:300},{x:0,y:350},{x:0,y:375},{x:0,y:388}];
	var pointsx = [{x:0,y:0},{y:0,x:200},{y:0,x:300},{y:0,x:350},{y:0,x:375},{y:0,x:388}];
	it('returns the entire envelope when the aspect ratio is correct', function() {
		squareWithMaxNumOfPoints(pointsx,square,1).should.eql(square);
		squareWithMaxNumOfPoints(pointsx,fatrect1,2).should.eql(fatrect1);
		squareWithMaxNumOfPoints(pointsx,fatrect2,2).should.eql(fatrect2);
		squareWithMaxNumOfPoints(pointsx,thinrect1,5).should.eql(thinrect1);
		squareWithMaxNumOfPoints(pointsx,thinrect2,5).should.eql(thinrect2);
	})
	it('returns the more valuable part of the rectangle', function() {
		squareWithMaxNumOfPoints(pointsx,fatrect1,1).should.eql({minx:0,maxx:300,miny:0,maxy:300});
		squareWithMaxNumOfPoints(pointsx,fatrect2,1).should.eql({minx:200,maxx:400,miny:0,maxy:200});
		squareWithMaxNumOfPoints(pointsx,thinrect1,2).should.eql({minx:0,maxx:100,miny:0,maxy:200});
		squareWithMaxNumOfPoints(pointsx,thinrect2,2).should.eql({minx:200,maxx:380,miny:0,maxy:90});
	})
});

describe('square-with-max-points', function() {
	it('works for the SE example', function() {
		squareWithMaxNumOfPoints(
				[{x:0,y:0},{x:0,y:60},{x:0,y:100},{x:0,y:140},{x:0,y:200}],
				{minx:0,miny:0, maxx:80,maxy:200},
				1).should.eql({minx:0,maxx:80,miny:60,maxy:140});
	})
	it('works for the bug found by abuzittin gillifirca', function() {
		// http://codereview.stackexchange.com/questions/46531/reducing-code-duplication-in-a-geometric-function
		squareWithMaxNumOfPoints(
				[{x:1,y:200},{x:2,y:200},{x:3,y:200},{x:4,y:200}],
				{minx:0,miny:0, maxx:80,maxy:200},
				1).should.eql({minx:0,maxx:80,miny:120,maxy:200});
	})
	it('works for bug #1 found by Flambino', function() {
		// http://codereview.stackexchange.com/a/46543/20684
		squareWithMaxNumOfPoints(
				[{x:100,y:300}],
				{minx:0,miny:0, maxx:200,maxy:100},
				1).should.eql({minx:0,miny:0,maxx:100,maxy:100});
	})
	it('works for bug #2 found by Flambino', function() {
		// http://codereview.stackexchange.com/a/46543/20684
		squareWithMaxNumOfPoints(
				[
				 {x:0,y:0},{x:0,y:10},{x:0,y:20},{x:0,y:30},{x:0,y:40},{x:0,y:50},{x:0,y:60},{x:0,y:70},
				 {x:200,y:0},{x:199,y:10},{x:198,y:20},{x:197,y:30},{x:196,y:40},
				 ],
				{minx:0,miny:0, maxx:200,maxy:100},
				1).should.eql({minx:0,miny:0,maxx:100,maxy:100});
		squareWithMaxNumOfPoints(
				[
				 {x:0,y:0},{x:1,y:10},{x:2,y:20},{x:3,y:30},{x:4,y:40},
				 {x:200,y:0},{x:200,y:10},{x:200,y:20},{x:200,y:30},{x:200,y:40},{x:200,y:50},{x:200,y:60},{x:200,y:70},
				 ],
				{minx:0,miny:0, maxx:200,maxy:100},
				1).should.eql({minx:100,miny:0,maxx:200,maxy:100});
	})
});
