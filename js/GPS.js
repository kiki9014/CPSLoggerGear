var options = {enableHighAccuracy: true, maximumAge: 600000, timeout: 0};
var watchID;

function successCallback(position)
{
	console.log(position);
}

function errorCallback(error)
{
	console.log(error.message);
}
// start watching current location
var watchID = navigator.geolocation.watchPosition(successCallback, errorCallback);

console.log("GPS");

// stop watching
//navigator.geolocation.clearWatch(watchID);