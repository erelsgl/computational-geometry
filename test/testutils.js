
Object.prototype.shouldEqualRectangle = function(minx,miny,  maxx,maxy) {
	this.minx.should.equal(minx);
	this.miny.should.equal(miny);

	this.maxx.should.equal(maxx);
	this.maxy.should.equal(maxy);
}
