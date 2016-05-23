var logStream, logDir, logFile, logOpen = false, logQueue = "";

function timeStamp(){
	var month, date, hour, minute, second, milSec, time = tizen.time.getCurrentDateTime();
	
	month = time.getMonth()+1;
	date = time.getDate();
	hour = time.getHours();
	minute = time.getMinutes();
	second = time.getSeconds();
	milSec = time.getMilliseconds();
	
	return month.toString() + "_" + date.toString() + "_" + hour.toString() + "_" + minute.toString() + "_" + second.toString() + "_" + milSec.toString();
}

function startLogging (){
	tizen.filesystem.resolve("documents",
		function(dir){
			logDir = dir;
			try{
				logFile = logDir.resolve("SensingLog_" + timeStamp() + ".txt");
			}
			catch(e){
				logFile = logDir.createFile("SensingLog_" + timeStamp() + ".txt");
			}
			logFile.openStream('a',
			function(stream){
				logStream = stream;
				logOpen = true;
				if(logQueue.length!=0){
					logStream.write(logQueue);
					logQueue = "";
				}
			}, function(error){
				console.log("Error : " + error);
			});
		}, function(error) {
		console.log("Error : " + error);
		}, 'rw'
	);
}

function logging(log){
	if(logOpen)
		logStream.write(timeStamp() + " : " + log + "\n");
	else
		logQueue += timeStamp() + " : " + log + "\n";
}

function endLogging(){
	logStream.close();
	logOpen = false;
}

function loggingError(err){
	logging("Error : " + err);
}