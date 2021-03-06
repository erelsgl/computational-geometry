#!mocha
/**
 * a unit-test for fair-and-square division.
 *
 * @author Erel Segal-Halevi
 * @since 2017-01
 */

var should = require('should');
require("./testutils")

var jsts = require("../lib");
require("../lib/fair-and-square-division");

var factory = new jsts.geom.GeometryFactory();

var CAKE = new jsts.geom.Envelope(0,100,0,100);
var MAX_SLIMNESS = 1;  // squares

describe('fair-and-square-division in simple cases', function() {
	it('returns empty division for 0 agents', function() {
		agentsValuePoints = []
		factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS).should.have.lengthOf(0);
	})

	it('returns the entire cake for 1 agent with value', function() {
		agentsValuePoints = [ [{x:1,y:1}, {x:99,y:99}] ]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(1);
		plots[0].shouldEqualRectangle(0,0, 100,100);
	})
	it('returns the entire cake for 1 agent with value at two corners', function() {
		agentsValuePoints = [ [{x:0,y:0}, {x:100,y:100}] ]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(1);
		plots[0].shouldEqualRectangle(0,0, 100,100);
	})

	it('divides the cake between 2 agents with different best-quarters', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:9,y:9}, {x:1,y:9}, {x:9,y:1},{x:5,y:5}],
			[{x:91,y:91}, {x:99,y:99}, {x:91,y:99}, {x:99,y:91},{x:97,y:97}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(0,0, 50,50);
		plots[1].shouldEqualRectangle(50,50, 100,100);
	})

	it('divides the cake between 2 agents with identical valuations', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:70}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:70}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(70,70, 100,100);
		plots[1].shouldEqualRectangle(0,0, 70,70);
	})

	it('divides the cake between 2 agents with best-quarter NE', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:70}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:60,y:60}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(65,65, 100,100);
		plots[1].shouldEqualRectangle(0,0, 65,65);
	})

	it('divides the cake between 2 agents with best-quarter SW', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:30,y:30}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:40,y:40}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(0,0, 35,35);
		plots[1].shouldEqualRectangle(35,0, 100,65);
	})

	it('divides the cake between 2 agents with best-quarter SE', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:70,y:30}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:60,y:40}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(65,0, 100,35);
		plots[1].shouldEqualRectangle(0,0, 65,65);
	})

	it('divides the cake between 2 agents with best-quarter NW', function() {
		agentsValuePoints = [
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:30,y:70}],
			[{x:1,y:1}, {x:99,y:99}, {x:1,y:99}, {x:99,y:1},{x:40,y:60}],
		]
		plots = factory.createFairAndSquareDivision(agentsValuePoints,CAKE,MAX_SLIMNESS);
		plots.should.have.lengthOf(2);
		//console.dir(plots)
		plots[0].shouldEqualRectangle(0,65, 35,100);
	})
})

describe('half-proportional-staircase in interesting cases', function() {
})
