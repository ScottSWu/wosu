<?php
	function get($url) {
		$curl = curl_init();
		curl_setopt($curl,CURLOPT_RETURNTRANSFER,1);
		curl_setopt($curl,CURLOPT_URL,str_replace(" ","%20",$url));
		//curl_setopt($curl,CURLOPT_USERAGENT,"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36");
		curl_setopt($curl,CURLOPT_USERAGENT,"Web osu! Replay Viewer");
		curl_setopt($curl,CURLOPT_CONNECTTIMEOUT,30);
		$res = curl_exec($curl);
		curl_close($curl);
		return $res;
	}
	
	if (!isset($_GET["q"])) {
		die("{\"status\":\"error\", \"message\":\"No query.\"}");
	}
	
	$data = get(base64_decode($_GET["q"]));
	if ($data) {
		echo $data;
	}
	else {
		die("{\"status\":\"error\", \"message\":\"A server error occured.\"}");
	}
?>