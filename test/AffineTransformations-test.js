/**
 * a unit-test for numeric-utils
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../lib");

describe('transformation', function() {
	var transformation1 = [{translate: [10,20]}, {scale: 2}, {reflectXY: true}];
	var transformation2 = [{translate: [10,20]}, {scale: 2}, {reflectXY: false}];
	var transformation3 = [{translate: [10,20]}, {scale: 2}, {rotateQuarters: 1}];
	var point = {x:30,y:40};
	it('works direct on point', function() {
		jsts.algorithm.transformedPoint(transformation1, point).should.eql({x:120,y:80});
		jsts.algorithm.transformedPoint(transformation2, point).should.eql({x:80,y:120});
		jsts.algorithm.transformedPoint(transformation3, point).should.eql({x:-120,y:80});
	})
	it('works reverse on point', function() {
		var reverse1 = jsts.algorithm.reverseTransformation(transformation1);
		jsts.algorithm.transformedPoint(reverse1, {x:120,y:80}).should.eql(point);
		var reverse2 = jsts.algorithm.reverseTransformation(transformation2);
		jsts.algorithm.transformedPoint(reverse2, {x:80,y:120}).should.eql(point);
		var reverse3 = jsts.algorithm.reverseTransformation(transformation3);
		jsts.algorithm.transformedPoint(reverse3, {x:-120,y:80}).should.eql(point);
	})
	
	var factory = new jsts.geom.GeometryFactory();
	var rectangle = factory.createAxisParallelRectangle({minx:0,miny:0, maxx:1,maxy:2});
	it('works direct on rect', function() {
		jsts.algorithm.transformedAxisParallelRectangle(transformation1, rectangle).should.have.properties({miny:20,minx:40, maxy:22,maxx:44});
		jsts.algorithm.transformedAxisParallelRectangle(transformation2, rectangle).should.have.properties({minx:20,miny:40, maxx:22,maxy:44});
		jsts.algorithm.transformedAxisParallelRectangle(transformation3, rectangle).should.have.properties({miny:20,minx:-44, maxy:22,maxx:-40});
	})
})
