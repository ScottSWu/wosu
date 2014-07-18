<?php
	header('Content-type: text/html; charset=utf-8');
	
	if (!isset($_FILES["replayFile"]))
		die("{\"status\": \"error\", \"message\": \"No file was received.\"}");
	if (strtoupper(substr($_FILES["replayFile"]["name"],-4))!=".OSR")
		die("{\"status\": \"error\", \"message\": \"File is not an osu! replay file. (" . strtoupper(substr($_FILES["replayFile"]["name"],-4)) . ")\"}");
	if ($_FILES["replayFile"]["size"]>2048000)
		die("{\"status\": \"error\", \"message\": \"File size exceeds limit.\"}");
	
	$fin = $_FILES["replayFile"]["tmp_name"];
	$fo = fopen($fin,"rb");
	if (!$fo) $fo = file_get_contents($fin);
	if (!$fo) $fo = file_get_contents($fin,true);
	if (!$fo) $fo = file_get_contents($fin,FILE_USE_INCLUDE_PATH);
	if (!$fo) die("{\"status\": \"error\", \"message\": \"Failed to read replay.\"}");
	
	echo "{\"status\": \"success\", \"data\": \"";
	if ($fo) {
		while (!feof($fo)) {
			echo bin2hex(fread($fo,1024));
		}
		fclose($fo);
	}
	echo "\"}";
?>