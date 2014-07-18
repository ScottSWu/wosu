WOsu.ReplayLoader = { };

WOsu.ReplayLoader.load = function(data,finish,progress) {
	var replay = new WOsu.Replay();
	
	var bytes = new Uint8ClampedArray(~~(data.length/2));
	for (var i=0; i<bytes.length; i++) {
		bytes[i] = parseInt(data[2*i] + data[2*i+1],16);
	}
	var index = 0;
	
	function getByte() {
		return bytes[index++];
	}
	
	function getShort() {
		return bytes[index++] | (bytes[index++]<<8);
	}
	
	function getInt() {
		return bytes[index++] | (bytes[index++]<<8) | (bytes[index++]<<16) | (bytes[index++]<<24);
	}
	
	function getLong() {
		return getInt() + getInt()*0x100000000;
	}
	
	function getULEB128() {
		var val = 0;
		var i = 0;
		var c;
		while (((c = getByte()) & 0x80)==0x80) {
			val = val | ((c & 0x7F)<<(i++*7));
		}
		val = val | ((c & 0x7F)<<(i++*7));
		return val;
	}
	
	function getString(len) {
		var s = "";
		for (var i=0; i<len; i++) {
			s += String.fromCharCode(getByte());
		}
		return s;
	}
	
	function getBytes(len) {
		var b = new Uint8ClampedArray(len);
		for (var i=0; i<len; i++) {
			b[i] = getByte();
		}
		return b;
	}
	
	function getGraph(str) {
		return str;
	}
	
	var cont = 0;
	
	replay.type = getByte();
	replay.version = getInt();
	cont = getByte();
	if (cont==0x0B) replay.bhash = getString(getULEB128());
	cont = getByte();
	if (cont==0x0B) replay.player = getString(getULEB128());
	cont = getByte();
	if (cont==0x0B) replay.rhash = getString(getULEB128());
	replay.hits[0] = getShort();
	replay.hits[1] = getShort();
	replay.hits[2] = getShort();
	replay.hits[3] = getShort();
	replay.hits[4] = getShort();
	replay.hits[5] = getShort();
	replay.score = getInt();
	replay.combo = getShort();
	replay.perfect = getByte()==1;
	replay.mods = getInt();
	cont = getByte();
	if (cont==0x0B) replay.graph = getGraph(getString(getULEB128()));
	replay.timestamp = getLong();
	
	var datasize = getInt();
	LZMA.decompress(
		bytes.subarray(index),
		function(data) {
			replay.updateStatus("Decompression completed");
			finish();
		},
		function(percent) {
			replay.updateStatus(percent + " decompressed");
			progress();
		}
	);
	
	return replay;
}