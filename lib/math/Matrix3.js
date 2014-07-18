WOsu.Matrix3 = function(args) {
	this.matrix = new Array(9);
	try {
		this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
		if (args.length==1 && args[0]==0) {
			this.matrix = [ 0,0,0, 0,0,0, 0,0,0 ];
		}
		else if (args.length==4) {
			this.matrix[0] = args[0];
			this.matrix[1] = args[1];
			this.matrix[3] = args[2];
			this.matrix[4] = args[3];
		}
		else if (args.length>=6) {
			for (var i=0; i<args.length; i++) this.matrix[i] = args[i];
		}
	}
	catch (err) {
		this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
	}
}

WOsu.Matrix3.prototype.constructor = WOsu.Matrix3;

WOsu.Matrix3.getRotation = function(theta) {
	return new WOsu.Matrix3([Math.cos(theta),-Math.sin(theta),Math.sin(theta),Math.cos(theta)]);
}

WOsu.Matrix3.getScale = function(x,y) {
	return new WOsu.Matrix3([ x,0,0, 0,y,0, 0,0,1 ]);
}

WOsu.Matrix3.getTranslation = function(x,y) {
	return new WOsu.Matrix3([ 1,0,x, 0,1,y, 0,0,1 ]);
}

WOsu.Matrix3.prototype.clone = function() {
	return new WOsu.Matrix3(this.matrix);
}

WOsu.Matrix3.prototype.reset = function() {
	this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
}

WOsu.Matrix3.prototype.multiply = function(mat2) {
	this.matrix = [
		this.matrix[0]*mat2.matrix[0] + this.matrix[1]*mat2.matrix[3] + this.matrix[2]*mat2.matrix[6],
		this.matrix[0]*mat2.matrix[1] + this.matrix[1]*mat2.matrix[4] + this.matrix[2]*mat2.matrix[7],
		this.matrix[0]*mat2.matrix[2] + this.matrix[1]*mat2.matrix[5] + this.matrix[2]*mat2.matrix[8],
		this.matrix[3]*mat2.matrix[0] + this.matrix[4]*mat2.matrix[3] + this.matrix[5]*mat2.matrix[6],
		this.matrix[3]*mat2.matrix[1] + this.matrix[4]*mat2.matrix[4] + this.matrix[5]*mat2.matrix[7],
		this.matrix[3]*mat2.matrix[2] + this.matrix[4]*mat2.matrix[5] + this.matrix[5]*mat2.matrix[8],
		this.matrix[6]*mat2.matrix[0] + this.matrix[7]*mat2.matrix[3] + this.matrix[8]*mat2.matrix[6],
		this.matrix[6]*mat2.matrix[1] + this.matrix[7]*mat2.matrix[4] + this.matrix[8]*mat2.matrix[7],
		this.matrix[6]*mat2.matrix[2] + this.matrix[7]*mat2.matrix[5] + this.matrix[8]*mat2.matrix[8]
	];
}

WOsu.Matrix3.prototype.multiplyB = function(mat2) {
	this.matrix = [
		mat2.matrix[0]*this.matrix[0] + mat2.matrix[1]*this.matrix[3] + mat2.matrix[2]*this.matrix[6],
		mat2.matrix[0]*this.matrix[1] + mat2.matrix[1]*this.matrix[4] + mat2.matrix[2]*this.matrix[7],
		mat2.matrix[0]*this.matrix[2] + mat2.matrix[1]*this.matrix[5] + mat2.matrix[2]*this.matrix[8],
		mat2.matrix[3]*this.matrix[0] + mat2.matrix[4]*this.matrix[3] + mat2.matrix[5]*this.matrix[6],
		mat2.matrix[3]*this.matrix[1] + mat2.matrix[4]*this.matrix[4] + mat2.matrix[5]*this.matrix[7],
		mat2.matrix[3]*this.matrix[2] + mat2.matrix[4]*this.matrix[5] + mat2.matrix[5]*this.matrix[8],
		mat2.matrix[6]*this.matrix[0] + mat2.matrix[7]*this.matrix[3] + mat2.matrix[8]*this.matrix[6],
		mat2.matrix[6]*this.matrix[1] + mat2.matrix[7]*this.matrix[4] + mat2.matrix[8]*this.matrix[7],
		mat2.matrix[6]*this.matrix[2] + mat2.matrix[7]*this.matrix[5] + mat2.matrix[8]*this.matrix[8]
	];
}

WOsu.Matrix3.multiply = function(mat1,mat2) {
	return new WOsu.Matrix3([
		mat1.matrix[0]*mat2.matrix[0] + mat1.matrix[1]*mat2.matrix[3] + mat1.matrix[2]*mat2.matrix[6],
		mat1.matrix[0]*mat2.matrix[1] + mat1.matrix[1]*mat2.matrix[4] + mat1.matrix[2]*mat2.matrix[7],
		mat1.matrix[0]*mat2.matrix[2] + mat1.matrix[1]*mat2.matrix[5] + mat1.matrix[2]*mat2.matrix[8],
		mat1.matrix[3]*mat2.matrix[0] + mat1.matrix[4]*mat2.matrix[3] + mat1.matrix[5]*mat2.matrix[6],
		mat1.matrix[3]*mat2.matrix[1] + mat1.matrix[4]*mat2.matrix[4] + mat1.matrix[5]*mat2.matrix[7],
		mat1.matrix[3]*mat2.matrix[2] + mat1.matrix[4]*mat2.matrix[5] + mat1.matrix[5]*mat2.matrix[8],
		mat1.matrix[6]*mat2.matrix[0] + mat1.matrix[7]*mat2.matrix[3] + mat1.matrix[8]*mat2.matrix[6],
		mat1.matrix[6]*mat2.matrix[1] + mat1.matrix[7]*mat2.matrix[4] + mat1.matrix[8]*mat2.matrix[7],
		mat1.matrix[6]*mat2.matrix[2] + mat1.matrix[7]*mat2.matrix[5] + mat1.matrix[8]*mat2.matrix[8]
	]);
}

WOsu.Matrix3.prototype.getCSS3Transform = function() {
	return "matrix(" + [this.matrix[0],this.matrix[3],this.matrix[1],this.matrix[4],this.matrix[2],this.matrix[5]].join() + ")";
}