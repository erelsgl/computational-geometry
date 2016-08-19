/**
 * Calculate a square containing a maximal number of points.
 *
 * @author Erel Segal-Halevi
 * @since 2014-04
 *
 * REVIEWED AND CORRECTED BY:
 * * Flambino
 * * abuzittin gillifirca
 * http://codereview.stackexchange.com/questions/46531/reducing-code-duplication-in-a-geometric-function
 */

var jsts = global.jsts;
var utils = require('./numeric-utils');
var _ = require("underscore");

/**
 * @param points array of points, e.g. [{x:0,y:0}, {x:100,y:100}, etc.]
 * @param envelope defines the bounding rectangle, e.g. {minx: 0, maxx: 100, miny: 0, maxy: 200}
 * @param maxAspectRatio number>=1: the maximum width/height ratio of the returned rectangle.
 * @return a rectangle contained within the envelope, with aspect ratio at most maxAspectRatio, that contains a largest number of points.
 */
jsts.algorithm.squareWithMaxNumOfPoints = function(points, envelope, maxAspectRatio) {
	if (!maxAspectRatio) maxAspectRatio=1;
	var width = envelope.maxx-envelope.minx;
	var height = envelope.maxy-envelope.miny;
	var largestWidthPerHeight = maxAspectRatio*height;
	var largestHeightPerWidth = maxAspectRatio*width;
	var result = {};
	points = jsts.algorithm.pointsInEnvelope(points, envelope);
	//console.dir(envelope)
	//console.log(width+" "+largestWidthPerHeight+" "+height+" "+largestHeightPerWidth)
	if (width<=largestWidthPerHeight && height<=largestHeightPerWidth) {
		// the envelope has aspect ratio at most maxAspectRatio, so just return it entirely:
		result = {minx:envelope.minx, maxx:envelope.maxx, miny:envelope.miny, maxy:envelope.maxy};
	} else if (width>largestWidthPerHeight) {
		var miny = result.miny = envelope.miny;
		var maxy = result.maxy = envelope.maxy;
		var xValues = utils.sortedUniqueValues(points, ["x"]);
		if (xValues.length==0) {  // no x values in the envelope - just return any rectangle within the envelope
			result.minx = envelope.minx;
			result.maxx = result.minx+largestWidthPerHeight;
		} else {
			var maxNum   = 0;
			for (var i=0; i<xValues.length; ++i) {
				var minx = Math.min(xValues[i], envelope.maxx-largestWidthPerHeight);
				var maxx = minx+largestWidthPerHeight;
				var curNum = jsts.algorithm.numPointsInXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.minx = minx;
					result.maxx = maxx;
				}
			}
		}
	} else {  // height>largestHeightPerWidth
		var minx = result.minx = envelope.minx;
		var maxx = result.maxx = envelope.maxx;
		var yValues = utils.sortedUniqueValues(points, ["y"]);
		if (yValues.length==0) {  // no y values in the envelope - just return any rectangle within the envelope
			result.miny = envelope.miny;
			result.maxy = result.miny+largestHeightPerWidth;
		} else {
			var maxNum   = 0;
			for (var i=0; i<yValues.length; ++i) {
				var miny = Math.min(yValues[i], envelope.maxy-largestHeightPerWidth);
				var maxy = miny+largestHeightPerWidth;
				var curNum = jsts.algorithm.numPointsInXY(points, minx,miny,maxx,maxy);
				if (curNum>maxNum) {
					maxNum = curNum;
					result.miny = miny;
					result.maxy = maxy;
				}
			}
		}
	}
	return result;
}
