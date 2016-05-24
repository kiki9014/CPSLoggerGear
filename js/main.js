var personName = "John";

function whoAmI(){
	return personName;
}

var sensorType = {
		ACC : 1,
		GYRO : 2,
		MAG : 3,
		UV : 4,
		Light : 5,
		Pressure : 6,
		HRM : 7,
		Battery : 8,
		Memory : 9
};

$(window).load(function(){

	var onSave = false, docuDir, newFile, fileStream, startTime, SService, UVSensor, LSensor, MagSensor, PSensor, HAM, data2Write = [], bgBtn, saveBtn, endSaveBtn, touchCnt=0, surveyCnt = 1;

	var localPort, remotePort, isAwake, handleCPU, watchID, surveyAlarm, handleBatt, listenID, buffer = "", saveID, HRVal, delayVal = 0, totDel = 0;
	
	startLogging();
	
	function endSensor(){
		UVSensor.stop();
		LSensor.stop();
		MagSensor.stop();
		PSensor.stop();
		if (isAwake)
			HAM.stop("HRM");
	}
	
	//end save. close stream
	function offSave(){
		logging("Save off");
		onSave = false;
		fileStream.close();
		document.getElementById("isSave").innerHTML = "Save OFF";
		window.clearInterval(saveID);
	}
	
	function quitFunc(){
		if (onSave) offSave();
		if (!onSave){
			endSensor();
			tizen.alarm.removeAll();
			tizen.power.release("CPU");
			window.clearInterval(handleCPU);
			endLogging();
			tizen.application.getCurrentApplication().exit();
		}
	}
	
	document.getElementById("quit-btn").addEventListener("click",quitFunc);
	
	//This listens for the back button press
	document.addEventListener('tizenhwkey', function(e) {
		if(e.keyName === "back"){
			quitFunc();
		}
	});

	//callback if it succeeds to start sensor (except Heart Rate, GPS)
	function onStartSensor(sensor){
		logging("Sensor" + sensor + "start");
	}
	
	//callback if it fails (sensor start, getData)
	function onFailSensor(error){
		logging("Fail : " + error);
	}

	//for name of file
	startTime = tizen.time.getCurrentDateTime();

	//time to String
	function timePrint(time){
		var hour, minute, second, milSec;
		
		hour = time.getHours();
		minute = time.getMinutes();
		second = time.getSeconds();
		milSec = time.getMilliseconds();
		
		return hour.toString()+"," + minute.toString() + "," + second.toString() + "," + milSec.toString();
	}
	
	//create txt file
	tizen.filesystem.resolve("documents", 
		function(result){
			docuDir = result;
			try{
				newFile = docuDir.resolve("HWsensing_" + timeStamp() + ".txt");
			}
			catch(e){
				newFile = docuDir.createFile("HWsensing_"+ timeStamp() +".txt");
			}
			logging("file open : " + newFile.toString());
		}, function(error){
			logging("error : " + error.message);
		}, 'rw'
	);

	
	//for convenience
	document.getElementById("time").innerHTML = "Start at " + timeStamp();
	
	//Sensor service is require to start each sensor
	SService = window.webapis&&window.webapis.sensorservice;	//tizen.sensorservice is not worked
	UVSensor = SService.getDefaultSensor("ULTRAVIOLET");
	LSensor = SService.getDefaultSensor("LIGHT");
	MagSensor = SService.getDefaultSensor("MAGNETIC");
	PSensor = SService.getDefaultSensor("PRESSURE");
	HAM = (tizen&&tizen.humanactivitymonitor)||(window.webapis&&window.webapis.motion);	//Heart Rate is another application, not sensor service
	
	//start each sensor
	UVSensor.start(onStartSensor, onFailSensor);
	LSensor.start(onStartSensor, onFailSensor);
	MagSensor.start(onStartSensor, onFailSensor);
	PSensor.start(onStartSensor, onFailSensor);
	
	//add listener. listener is called when sensor value has changed
	UVSensor.setChangeListener(function(data){
		document.getElementById("UV").innerHTML = 'UV : ' + data.ultravioletLevel;

		dataSave(sensorType.UV, data.ultravioletLevel);
	});

	MagSensor.setChangeListener(function(data){
		mag = [];
		
		document.getElementById("xmag").innerHTML = 'Mag X : ' + data.x;
		document.getElementById("ymag").innerHTML = 'Mag Y : ' + data.y;
		document.getElementById("zmag").innerHTML = 'Mag Z : ' + data.z;
		
		mag[0] = data.x;
		mag[1] = data.y;
		mag[2] = data.z;
		
		dataSave(sensorType.MAG,mag);
	});
	
	LSensor.setChangeListener(function(data){
		document.getElementById("light").innerHTML = 'Light : ' + data.lightLevel;
		
		dataSave(sensorType.Light, data.lightLevel);
	});
	
	PSensor.setChangeListener(function(data){
		document.getElementById("press").innerHTML = 'Pressure : ' + data.pressure;
		
		dataSave(sensorType.Pressure, data.pressure);
	});

	//start Heart Rate sensor
	
	function readHR(data){
		document.getElementById("heart").innerHTML = 'HeartRate : ' + data.heartRate;
		
		HRVal = data.heartRate;
		dataSave(sensorType.HRM, data.heartRate);
	}
	
	//get acceleration and angular velocity (reference : Mozilla Web API)
	window.addEventListener('devicemotion', function(e) {
		var ax,ay,az,rotx,roty,rotz,interval,currTime, acc = [], gyro = [];
		
		ax = e.accelerationIncludingGravity.x;
		ay = -e.accelerationIncludingGravity.y;
		az = -e.accelerationIncludingGravity.z;
		rotx = e.rotationRate.alpha ;
		roty = e.rotationRate.beta ;
		rotz = e.rotationRate.gamma ;
		interval = e.interval;
		
		acc[0] = ax;
		acc[1] = ay;
		acc[2] = az;
		
		gyro[0] = rotx;
		gyro[1] = roty;
		gyro[2] = rotz;

		document.getElementById("interv").innerHTML =  'Interval : ' +  interval;
		document.getElementById("xaccel").innerHTML =  'AccX : ' +  ax;
		document.getElementById("yaccel").innerHTML = 'AccY : ' + ay;
		document.getElementById("zaccel").innerHTML = 'AccZ : ' + az;
		
		document.getElementById("rotx").innerHTML = 'Rot X : ' + rotx ;
		document.getElementById("roty").innerHTML = 'Rot Y : ' + roty ;
		document.getElementById("rotz").innerHTML = 'Rot Z : ' + rotz ;
		
		dataSave(sensorType.ACC,acc);
		dataSave(sensorType.GYRO,gyro);
	});

	
	function getBatteryLevel(battery){
		batteryLev = battery.level;
		logging("battery level is " + batteryLev * 100 + "%");
		document.getElementById("battLev").innerHTML = 'Batterys : ' + batteryLev;
		dataSave(sensorType.Battery, batteryLev);
	}

	window.addEventListener('touchstart',function(e){
		touchCnt += 1;
		document.getElementById("touchCount").innerHTML = 'Touch : ' + touchCnt;
	});

	function batteryFunc(){
		tizen.systeminfo.getPropertyValue("BATTERY", getBatteryLevel, onFailSensor);
	}

	handleBatt = window.setInterval(batteryFunc,60*1000);
	function toggleHRM(){
		if(isAwake){ //stop HRM for 9minute
			if(isOn)
				HAM.stop("HRM");
			isAwake = false;
			window.clearInterval(handleCPU);
			handleCPU = window.setInterval(toggleHRM, 60000*30);
		}
		else{
			if(!isOn)
				HAM.start("HRM",readHR);
			isAwake = true;
			window.clearInterval(handleCPU);
			handleCPU = window.setInterval(toggleHRM, 60000);
		}
	}
	if(handleCPU == null){
		HAM.start("HRM",readHR);
		isAwake = true;
		isOn = true;
	}
	
	//app hide. Need to enable background-support in config.xml
	bgBtn = document.getElementById("bg-btn");
	bgBtn.addEventListener("click", function(){
		var app = tizen.application.getCurrentApplication();
		tizen.power.request("CPU","CPU_AWAKE");
		app.hide();
	});//add event listener to app hide button
	
	//start save. open stream to save
	saveBtn = document.getElementById("save-btn");
	saveBtn.addEventListener("click", function(){
		newFile.openStream("a",
			function(fs){
				fileStream = fs;
				logging("Hello gear!");
				onSave = true;
				
				saveID = window.setInterval(storeToFile,1000);
			}, function(e){
				logging("error : " + e.message);
		});
		surveyAlarm = setSurvey(30);
		document.getElementById("isSave").innerHTML = "Save ON";
	});//add event listener to save button

	endSaveBtn = document.getElementById("saveEnd-btn");
	endSaveBtn.addEventListener("click", offSave);//add event listener to save end button	
	try{
		localPort = tizen.messageport.requestLocalMessagePort("SAMPLE_PORT_1");
		remotePort = tizen.messageport.requestRemoteMessagePort("lfAUvVJvBV.SurveyApp","SAMPLE_PORT_2");
	}
	catch(e){
		logging(e.message);
	}
	
	function onScreenStateChanged(previousState, changedState){
		logging("state Changed from " + previousState + " to " + changedState);
		if(previousState !== "SCREEN_NORMAL" && changedState === "SCREEN_NORMAL"){
			var audioName = timePrint(tizen.time.getCurrentDateTime());
			
			startRecord(audioName + ".amr", 5000, false);
		}
	}
	
	try{
		watchID = localPort.addMessagePortListener(function(data, remote){
			switch(data[0].value){
			case "heartRate":
				remote.sendMessage([{key:"values", value:HRVal}]);
				break;
			case "surveyCnt":
				remote.sendMessage([{key:"values", value:surveyCnt++}]);
				break;
			case "surveyStart":
				if(audioBusy){
					stopRecord();
				}
				var audioName = timePrint(tizen.time.getCurrentDateTime());
				isOn = true;
				startRecord("UserInput"+audioName+".amr",5000,true);
				logging("surveyStart");
				totDel = 0;
				delayVal = 0;
				break;
			case "surveyEnd":
				stopRecord();
				isOn = false;
				logging("successfully removed surveyAlarm");
				surveyAlarm = setSurvey(30);
				logging("successfully reset surveyAlarm");
				break;
			case "recordPause":
				stopRecord();
				break;
			case "postpone":
				delayVal = data[1].value;
				totDel += delayVal;
				setSurvey(delayVal);
				break;
			case "checkDelayed" : 
				remote.sendMessage([{key:"values", value:totDel}]);
			default :
				logging("wrong Command");
			}
		});
	}
	catch(e){
		loggingError(e.message);
	}

	tizen.power.setScreenStateChangeListener(onScreenStateChanged);
	logging("Sensor loaded");
	function dataSave(type, value){
		//save all data to txt
		if(onSave === true){
			currTime = tizen.time.getCurrentDateTime();
			buffer += timePrint(currTime)+","+ type +","+ value.toString() +"\n";
		}
	}
	
	function memoryCallback(memory){
		memStat = memory.status;
		if(memStat === "WARNING"){
			dataSave(sensorType.Memory,1);
			logging("Memory state is warning. Please save your memory");
		}
		else{
			dataSave(sensorType.Memory,0);
		}
	}
	
	listenID = tizen.systeminfo.addPropertyValueChangeListener("MEMORY", memoryCallback, onFailSensor);
	
	function storeToFile(){
		fileStream.write(buffer);
		buffer = "";
	}
});