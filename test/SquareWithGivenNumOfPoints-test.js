#!mocha
/**
 * a unit-test for square-with-max-points
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../lib");
require("../lib/SquareWithGivenNumOfPoints")
var squareWithGivenNumOfPoints = jsts.algorithm.squareWithGivenNumOfPoints; // shorthand

var square = {minx:0,maxx:400,miny:0,maxy:400}

describe('square-with-given-num-of-points in simple cases', function() {
	it('returns one out of one point', function() {
		squareWithGivenNumOfPoints([{x:5,y:10}], {x:0,y:0}, 1).should.equal(10);
	})
	it('returns one out of two points', function() {
		squareWithGivenNumOfPoints([{x:5,y:10},{x:12,y:7}], {x:0,y:0}, 1).should.equal(10);
	})
	it('returns two out of two points', function() {
		squareWithGivenNumOfPoints([{x:5,y:10},{x:12,y:7}], {x:0,y:0}, 2).should.equal(12);
	})
	it('returns infinity when there are no points', function() {
		squareWithGivenNumOfPoints([], {x:0,y:0}, 1).should.equal(Infinity);
	})
	it('returns infinity when there are not enough points', function() {
		squareWithGivenNumOfPoints([{x:5,y:10}], {x:0,y:0}, 2).should.equal(Infinity);
	})
})
