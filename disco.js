/*
var SerialPort = require("serialport");
SerialPort.list(function(err, ports) {
  ports.forEach(function(port) {
	console.log(port.comName);
	console.log(port.pnpId);
	console.log(port.manufacturer);
  });
});
*/

var Twitter = require("twitter");
var http = require("http");
var SerialPort = require("serialport").SerialPort;

var comPort = "COM6";
var nLEDS = 4;
var speed = 40;
var mask = "001";

var client = new Twitter({
	consumer_key: "yrfKuYphzq8lFrqm72s6etiI4",
	consumer_secret: "b1hOmDonz1cNllAItWe3lJaqE27EUnSpbj3RFTJGEFhYrbd9hW",
	access_token_key: "707197523899842560-LSJ2zQ2JS9xFVQ1NpmMkNsTBABaHDWq",
	access_token_secret: "hpCSMpplSr84C4SLXeJrwHOSDJE7Qo35FqnWhvABGJpfj"
});

var last_tweet = "";

var params = {screen_name: "FunkDiscoLights"}; // tetris

function twitterCheck() {
	client.get("statuses/mentions_timeline", params, function(error, tweets, response) {
		if (!error) {
			if (tweets.length > 0) {
				if (tweets[0].created_at != last_tweet) {
					last_tweet = tweets[0].created_at;
					var s = tweets[0].text.toLowerCase();
					console.log("@" + tweets[0].user.screen_name + " said " + s);
					var a = s.split(" ");
					for (var c = 0; c < a.length; c++) {
						switch (a[c].trim()) {
							case "red":
								mask = "100";
								break;
							case "green":
								mask = "010";
								break;
							case "blue":
								mask = "001";
								break;
							case "yellow":
								mask = "110";
								break;
							case "cyan":
								mask = "011";
								break;
							case "white":
								mask = "111";
								break;
						}
					}
				}
			}
		}
	});
}

var serialPort = new SerialPort(comPort, {
	baudrate: 9600
});

var lineCB = null;

serialPort.on("open", function () {
	console.log(comPort + " open");
	var line = "";
	serialPort.on("data", function(data) {
		var c;
		for (c = 0; c < data.length; c++) {
			line += String.fromCharCode(data[c]);
		}
		c = line.indexOf("\r\n");
		if (c >= 0) {
			var s = line.substr(0, c);
			line = line.substr(c + 2);
			line = "";
			if (lineCB) {
				lineCB(s);
			} else {
				// console.log(s); // no logging callback, output to console
				if (s == "OK") {
					startAnimation();
				}
			}
		}
	});
});

var server = http.createServer(function(request, response) {
	// Initialise the request's body data
	var body = "";
	// Tie up the data event (to build the request body data)
	request.on("data", function(chunk) {
		body += chunk;
	});
	// End is called once per request when the body data has been received
	request.on("end", function() {
		response.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		if (request.method.toLowerCase() == "post") {
			lineCB = function(line) {
				response.end(JSON.stringify({
					state: "OK",
					result: line
				}));
				lineCB = null;
			};
			serialPort.write(body + "\n", function(err, results) {
				if (err) {
					response.end(JSON.stringify({
						state: "ERROR",
						description: "Error on serial port : " + err
					}));
				} else {
					// results = 7 here?
				}
			});
		} else {
			response.end(JSON.stringify({
				state: "ERROR",
				description: "Unsupported method : " + request.method
			}));
		}
	});
}).listen(1337, "0.0.0.0", 511, function() {
	console.log("Server running at http://127.0.0.1:1337/");
});

var pos = 0;
var dir = 1;
var buffer = [];

(function() {
	var c;
	for (c = 0; c < nLEDS; c++) {
		buffer.push(0);
	}
})();

function sendBuffer(completeCB) {
	var s = "";
	for (c = 0; c < buffer.length; c++) {
		// temp to int
		var cl = 0;
		switch (buffer[c]) {
			case 1:
				cl = 0x10;
				break;
			case 2:
				cl = 0x30;
				break;
			case 3:
				cl = 0xF0;
				break;
		}
		// int to color based on mask
		var ss;
		ss = mask.charAt(0) == "0" ? "00" : cl.toString(16);
		s += (ss.length == 1 ? "0" : "") + ss;
		ss = mask.charAt(1) == "0" ? "00" : cl.toString(16);
		s += (ss.length == 1 ? "0" : "") + ss;
		ss = mask.charAt(2) == "0" ? "00" : cl.toString(16);
		s += (ss.length == 1 ? "0" : "") + ss;
	}
	serialPort.write(s + "\n", function(err, results) {
		if (err) {
			console.log("Error on serial port : " + err);
		} else if (completeCB) {
			completeCB();
		}
	});
}

var lastTweetCheckTime = 0;

function startAnimation() {
	setTimeout(function() {
		for (var c = 0; c < buffer.length; c++) {
			if (buffer[c] > 0) {
				buffer[c]--;
			}
		}
		if (pos + dir < 0) {
			dir = 1;
		} else if (pos + dir >= buffer.length) {
			dir = -1;
		}
		pos += dir;
		buffer[pos] = 3;
		sendBuffer(function() {
			startAnimation();
		});
		// check twitter once per minute
		var d = new Date();
		var n = d.getTime();
		if (n > lastTweetCheckTime + (1000 * 60)) {
			lastTweetCheckTime = n;
			twitterCheck();
		}

	}, speed);
}
