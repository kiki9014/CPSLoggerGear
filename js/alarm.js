var alarm = [], surveyAlarm;

/*setting alarms*/
alarm[0] = new tizen.AlarmAbsolute(new Date(2015,9,14,13,10),5*tizen.alarm.PERIOD_MINUTE);
var appCntl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/view");

function setSurvey(minute){
//	console.log("Debug Probe 9.1.1");
	var surAl = new tizen.AlarmRelative(minute*tizen.alarm.PERIOD_MINUTE);
//	console.log("Debug Probe 9.1.2");
	tizen.alarm.add(surAl, "lfAUvVJvBV.SurveyApp", appCntl);
//	console.log("Debug Probe 9.1.3");
	logging("set survey");
//	console.log("Debug Probe 9.1.4");s
	
	return surAl.id;
}
/*
for (var i=0; i<alarm.length;i++){
	if(audioBusy){
		stopRecord();
	}
	//surveyAlarm = tizen.alarm.add(alarm[0],"lfAUvVJvBV.UITest0730",appCntl);
}*/