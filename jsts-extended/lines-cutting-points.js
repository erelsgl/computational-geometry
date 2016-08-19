/**
 * Calculate a set of parallel lines dividing a set of points equally.
 * 
 * @author Erel Segal-Halevi
 * @since 2014-04
 */

var jsts = require('jsts');
var _ = require("underscore");

/**
 * @param points array of points, e.g. [{x:0,y:0}, {x:100,y:100}, etc.]
 * @param numOfPieces positive integer: number of pieces (the number of cuts is numOfPieces+1).
 * @return a rectangle contained within the envelope, with aspect ratio at most maxAspectRatio, that contains a largest number of points. 
 */
jsts.algorithm.yCuts = function(points, numOfPieces) {
	if (!maxAspectRatio) maxAspectRatio=1;
	var width = envelope.maxx-envelope.minx;
	var height = envelope.maxy-envelope.miny;
	var largestWidthPerHeight = maxAspectRatio*height;
	var largestHeightPerWidth = maxAspectRatio*width;
	var result = {};
	if (width<=largestWidthPerHeight && height<=largestHeightPerWidth) {  
		// the envelope has aspect ratio at most maxAspectRatio, so just return it entirely:
		result = envelope;
	} else if (width>largestWidthPerHeight) {
		var miny = result.miny = envelope.miny;
		var maxy = result.maxy = envelope.maxy;
		var xValues = _.chain(points)
			.pluck("x")                           // get the x values
			.sort(function(a,b) { return a-b; })  // sort them in increasing order
			.uniq(/*sorted=*/true)                // keep each value only once
			.filter(function(x) { return envelope.minx<=x && x<=envelope.maxx})  // keep only values in the envelope
			.value();
		if (xValues.length==0) {  // no x values in the envelope - just return any rectangle within the envelope
			result.minx = envelope.minx;
			result.maxx = result.minx+largestWidthPerHeight;
		} else {
			var maxNum   = 0;
			for (var i=0; i<xValues.length; ++i) {
				var minx = xValues[i];
				var maxx = Math.min(minx+largestWidthPerHeight, envelope.maxx);
				var curNum = numPointsWithinXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.minx = minx;
				}
			}
			result.maxx = result.minx+largestWidthPerHeight;
		}
	} else {  // height>largestHeightPerWidth
		var minx = result.minx = envelope.minx;
		var maxx = result.maxx = envelope.maxx;
		var yValues = _.chain(points)
			.pluck("y")                           // get the x values
			.sort(function(a,b) { return a-b; })  // sort them in increasing order
			.uniq(/*sorted=*/true)                // keep each value only once
			.filter(function(y) { return envelope.miny<=y && y<=envelope.maxy})  // keep only values in the envelope
			.value();
		if (yValues.length==0) {  // no y values in the envelope - just return any rectangle within the envelope
			result.miny = envelope.miny;
			result.maxy = result.miny+largestHeightPerWidth;
		} else { 
			var maxNum   = 0;
			for (var i=0; i<yValues.length; ++i) {
				var miny = yValues[i];
				var maxy = Math.min(miny+largestHeightPerWidth, envelope.maxy);
				var curNum = numPointsWithinXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.miny = miny;
				}
			}
			result.maxy = result.miny+largestHeightPerWidth;
		}
	}
	return result;
}

/**
 * @param sortedValues a sorted array of values, e.g. [0, 2, 6, 7...]
 * @param numOfPieces positive integer: number of pieces (the number of cuts is numOfPieces+1).
 * @return an array of values such that, the number of points between each two consecutive values (including the values themselves) is approximately equal.  
 */
jsts.algorithm.cuts = function(sortedValues, numOfPieces) {
	
}

