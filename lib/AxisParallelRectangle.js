(function() {

  /**
   * Represents an axis-parallel rectangle.
   * Defined by: minx, miny, maxx, maxy.
   * @author Erel Segal-Halevi
   * @since 2014-03
   */


  /**
   * @requires jsts/geom/Geometry.js
   */

  /**
   * @extends {jsts.geom.Geometry}
   * @constructor
   */
  jsts.geom.AxisParallelRectangle = function(minx,miny, maxx,maxy, factory) {
	  this.minx = Math.min(minx,maxx);
	  this.miny = Math.min(miny,maxy);
	  this.maxx = Math.max(minx,maxx);
	  this.maxy = Math.max(miny,maxy);
      this.factory = factory;
  };

  jsts.geom.AxisParallelRectangle.prototype = new jsts.geom.Geometry();
  jsts.geom.AxisParallelRectangle.constructor = jsts.geom.AxisParallelRectangle;

  jsts.geom.AxisParallelRectangle.prototype.getCoordinates = function() {
	  throw new Error("not implemented");
  }
  
  jsts.geom.AxisParallelRectangle.prototype.getCoordinates = function() {
	  throw new Error("not implemented");
	  return [];
  };

  /**
   * @return {boolean}
   */
  jsts.geom.AxisParallelRectangle.prototype.isEmpty = function() {
    return (this.minx==this.maxx || this.miny==this.maxy);
  };

  jsts.geom.AxisParallelRectangle.prototype.getExteriorRing = function() {
	  return this;
  };

  jsts.geom.AxisParallelRectangle.prototype.getInteriorRingN = function(n) {
	  throw new Error("not implemented");
  };

  jsts.geom.AxisParallelRectangle.prototype.getNumInteriorRing = function() {
    return 0;
  };

  /**
   * Returns the area of this <code>Polygon</code>
   *
   * @return the area of the polygon.
   */
  jsts.geom.AxisParallelRectangle.prototype.getArea = function() {
	  if (!this.area)  {
		  this.area = (this.maxx-this.minx)*(this.maxy-this.miny);
	  }
	  return this.area;
  };

  /**
   * Returns the perimeter of this <code>Polygon</code>
   *
   * @return the perimeter of the polygon.
   */
  jsts.geom.AxisParallelRectangle.prototype.getLength = function() {
	  if (!this.length)  {
		  this.length = 2*((maxx-minx)+(maxy-miny));
	  }
	  return this.length;
  };

  /**
   * Computes the boundary of this geometry
   *
   * @return {Geometry} a linear geometry (which may be empty).
   * @see Geometry#getBoundary
   */
  jsts.geom.AxisParallelRectangle.prototype.getBoundary = function() {
	  return this;
  };

  jsts.geom.AxisParallelRectangle.prototype.computeEnvelopeInternal = function() {
    return new jsts.geom.Envelope(this.minx, this.maxx, this.miny, this.maxy);
  };

  jsts.geom.AxisParallelRectangle.prototype.getDimension = function() {
    return 2;
  };

  jsts.geom.AxisParallelRectangle.prototype.getBoundaryDimension = function() {
    return 1;
  };


  /**
   * @param {Geometry}
   *          other
   * @param {number}
   *          tolerance
   * @return {boolean}
   */
  jsts.geom.AxisParallelRectangle.prototype.equalsExact = function(other, tolerance) {
    if (!this.isEquivalentClass(other)) {
      return false;
    }
    if (this.isEmpty() && other.isEmpty()) {
      return true;
    }
    if (this.isEmpty() !== other.isEmpty()) {
      return false;
    }
    return this.minx==other.minx && this.maxx==other.maxx && this.miny==other.miny && this.maxy==other.maxy;
  };

  jsts.geom.AxisParallelRectangle.prototype.compareToSameClass = function(o) {
	  return this.minx==other.minx && this.maxx==other.maxx && this.miny==other.miny && this.maxy==other.maxy;
  };

  jsts.geom.AxisParallelRectangle.prototype.apply = function(filter) {
	  throw new "not implemented";
  };

  jsts.geom.AxisParallelRectangle.prototype.apply2 = function(filter) {
	  throw new "not implemented";
  };

  /**
   * Creates and returns a full copy of this {@link Polygon} object. (including
   * all coordinates contained by it).
   *
   * @return a clone of this instance.
   */
  jsts.geom.AxisParallelRectangle.prototype.clone = function() {
    return new jsts.geom.AxisParallelRectangle(this.minx, this.miny, this.maxx, this.maxy, this.factory);
  };

  jsts.geom.AxisParallelRectangle.prototype.normalize = function() {
  };
  
  jsts.geom.AxisParallelRectangle.prototype.intersects = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return (
				  this.maxx>=other.minx && other.maxx>=this.minx && 
				  this.maxy>=other.miny && other.maxy>=this.miny
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  var Location = jsts.geom.Location;

//  jsts.geom.AxisParallelRectangle.prototype.relate2 = function(other) {
//	var im = new jsts.geom.IntersectionMatrix();
//	var II = (
//			  this.maxx>other.minx && other.maxx>this.minx && 
//			  this.maxy>other.miny && other.maxy>this.miny
//			 );
//    im.setAtLeast('FFFFFFFFF');
//	im.set(Location.INTERIOR, Location.INTERIOR, II? "2": "F");
//	return im;
//  }
  
  jsts.geom.AxisParallelRectangle.prototype.overlaps = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return !this.interiorDisjoint(other) && !this.contains(other) && !other.contains(this);
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.AxisParallelRectangle.prototype.interiorDisjoint = function(other) {
	  if (other instanceof jsts.geom.AxisParallelRectangle) {
		  return (
				  this.maxx<=other.minx || other.maxx<=this.minx || 
				  this.maxy<=other.miny || other.maxy<=this.miny
				 );
	  } else {
		  throw new "not implemented for "+other;
	  }
  }
  
  jsts.geom.AxisParallelRectangle.prototype.contains = function(other) {
	  if (other.coordinate) {
		  var x = other.coordinate.x;
		  var y = other.coordinate.y;
		  return (
				  this.minx<x && x<this.maxx &&
				  this.miny<y && y<this.maxy
				 )
	  } else {
		  throw new "not implemented for "+other;
	  }
  }

  /**
   * @return {String} String representation of Polygon type.
   */
  jsts.geom.AxisParallelRectangle.prototype.getGeometryType = function() {
    return 'Polygon';
  };

  /**
   * @return {String} String representation of Polygon type.
   */
  jsts.geom.AxisParallelRectangle.prototype.toString = function() {
    return 'RECTANGLE(['+this.minx+","+this.maxx+"]x["+this.miny+","+this.maxy+"])";
  };
  
  jsts.geom.AxisParallelRectangle.prototype.CLASS_NAME = 'jsts.geom.AxisParallelRectangle';

  

  function coord(x,y)  {  return new jsts.geom.Coordinate(x,y); }

  /**
   * Constructs a <code>Polygon</code> that is an axis-parallel rectangle with the given x and y values.
   * 
   * Can be called either with 4 parameters (minx,miny, maxx,maxy)
   * or with a single parameter with 4 fields (minx,miny, maxx,maxy).
   */
  jsts.geom.GeometryFactory.prototype.createAxisParallelRectangle = function(minx,miny, maxx,maxy) {
	if (arguments.length==1) {
		var envelope = minx;
		return new jsts.geom.AxisParallelRectangle(envelope.minx, envelope.miny, envelope.maxx, envelope.maxy, this);
	} else if (arguments.length==4) {
		return new jsts.geom.AxisParallelRectangle(minx,miny, maxx,maxy, this);
	} else {
		throw new Error("createAxisParallelRectangle expected 1 or 4 arguments, but found "+arguments.length)
	}
  };
})();


