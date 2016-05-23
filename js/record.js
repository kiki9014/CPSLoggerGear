var audioCntl, audioStream, audioBusy=false, audioTimer;

function errorCallback(error){
	logging(error.message);
}

function createControl(){
	navigator.webkitGetUserMedia({video:false,audio:true}, function(stream){
		audioStream = stream;
		navigator.tizCamera.createCameraControl(stream, function(control){
			audioCntl = control;
		}, errorCallback);
	},errorCallback);
}

function startRecord(name, timeInterval, manual){
	var settings = {};
	
	if(audioBusy) return false;
	
	settings.fileName = name;
	settings.recordingFormat = 'amr';
	
	audioCntl.recorder.applySettings(settings,function(){
		audioCntl.recorder.start(function(){
			logging("start Record");
			audioBusy = true;
			if(!manual)
				audioTimer = window.setInterval(stopRecord, timeInterval);
		},errorCallback);
	},errorCallback);
}

function stopRecord(){
	audioCntl.recorder.stop(function(){
		logging("stop Record");
		audioBusy = false;
		window.clearInterval(audioTimer);
	},errorCallback);
}

function resumeRecord(){
	audioCntl.recorder.start(function(){
		logging("restart Record");
		audioBusy = true;
	},errorCallback);
}

createControl();