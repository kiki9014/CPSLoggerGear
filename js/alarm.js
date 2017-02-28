var alarm = [], surveyAlarm;

var appCntl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/view");

function setSurvey(minute){
	var surAl = new tizen.AlarmRelative(minute*tizen.alarm.PERIOD_MINUTE);
	tizen.alarm.add(surAl, "lfAUvVJvBV.SurveyApp", appCntl);
	logging("set survey");
	
	return surAl.id;
}