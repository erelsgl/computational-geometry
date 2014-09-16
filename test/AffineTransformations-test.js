/**
 * a unit-test for numeric-utils
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var should = require('should');
var jsts = require("../lib");

describe('general transformation', function() {
	var transformation1 = [{translate: [10,20]}, {scale: 2}, {reflectXY: true}];
	var transformation2 = [{translate: [10,20]}, {scale: 2}, {reflectXY: false}];
	var transformation3 = [{translate: [10,20]}, {scale: 2}, {rotateQuarters: 1}];
	var point = {x:30,y:40};
	it('works direct', function() {
		jsts.algorithm.transformedPoint(transformation1, point).should.eql({x:120,y:80});
		jsts.algorithm.transformedPoint(transformation2, point).should.eql({x:80,y:120});
		jsts.algorithm.transformedPoint(transformation3, point).should.eql({x:-120,y:80});
	})
	it('works reverse', function() {
		var reverse1 = jsts.algorithm.reverseTransformation(transformation1);
		jsts.algorithm.transformedPoint(reverse1, {x:120,y:80}).should.eql(point);
		var reverse2 = jsts.algorithm.reverseTransformation(transformation2);
		jsts.algorithm.transformedPoint(reverse2, {x:80,y:120}).should.eql(point);
		var reverse3 = jsts.algorithm.reverseTransformation(transformation3);
		jsts.algorithm.transformedPoint(reverse3, {x:-120,y:80}).should.eql(point);
	})
})
