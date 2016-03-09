var http = require("http");
var formidable = require("formidable");
var util = require("util");
var getPixels = require("get-pixels");
var fs = require("fs-extra");
var SerialPort = require("serialport").SerialPort;

var comPort = "COM6";  // /dev/ttyACM0
var LEDdims = {width: 2, height: 2};

var serialPort = new SerialPort(comPort, {
	baudrate: 9600
});

var server = http.createServer(function(req, res) {

	function renderForm(flashMsg) {
		// show a file upload form
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(
			'<body style="font-family: sans-serif">'+
			'<h1>TTVs Excellent Image Uploader</h1>'+
			'<div style="border-top: 1px solid #000; border-bottom: 1px solid #000; margin-bottom: 12px;">' +
			flashMsg +
			'</div>'+
			'<form action="/upload" enctype="multipart/form-data" method="post">'+
			'<input type="file" name="imp_up"><br><br>'+
			'<input type="submit" value="Upload">'+
			'</form>'+
			'</body>'
		);
	}

	function darken(color, value) {
		switch (color) {
			case "r":
				return Math.floor(value / 2);
			case "g":
				return Math.floor(value / 2);
			case "b":
				return Math.floor(value / 3);
		}
	}

	if ((req.url == "/upload") && (req.method.toLowerCase() == "post")) {
		// parse a file upload
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			try {
				if (!files.imp_up) {
					throw "Missing image field";
				}
				if (files.imp_up.type != "image/png") {
					throw "Only png files are allowed";
				}
				fs.copySync(files.imp_up.path, "./img.png");
				fs.removeSync(files.imp_up.path);
				getPixels("./img.png", function(err, pixels) {
					fs.removeSync("./img.png");
					if (err) {
						throw "Bad image file " + err;
					}

					if (pixels.shape[2] != 4) {
						throw "Image must be in RGBA format";
					}

					var sz = {width: pixels.shape[0], height: pixels.shape[1]};
					var buffer = "";

					for (var y = 0; y < sz.height; y++) {
						if (y >= LEDdims.height) {
							break;
						}
						var x, x1, x2, xs;
						// handle direction so pixels snake left -> right, right -> left, left -> right etc
						if (y % 2 == 0) {
							x1 = 0;
							x2 = LEDdims.width;
							xs = 1;
						} else {
							x1 = LEDdims.width - 1;
							x2 = 0;
							xs = -1;
						}
						for (x = x1; ((x < x2) && (xs > 0)) || ((x >= x2) && (xs < 0)); x += xs) {
							var r, g, b, a;
							if (x >= sz.width) {
								r = 0;
								g = 0;
								b = 0;
								a = 0;
							} else {
								r = darken("r", pixels.get(x, y, 0));
								g = darken("g", pixels.get(x, y, 1));
								b = darken("b", pixels.get(x, y, 2));
								a = pixels.get(x, y, 3);
							}
							var s;
							s = r.toString(16);
							buffer += (s.length == 1 ? "0" : "") + s ;
							s = g.toString(16);
							buffer += (s.length == 1 ? "0" : "") + s ;
							s = b.toString(16);
							buffer += (s.length == 1 ? "0" : "") + s ;
						}
					}
					serialPort.write(buffer + "\n", function(err, results) {
						if (err) {
							throw "Error on serial port : " + err;
						} else {
							renderForm("Image updated!<br />" /* + buffer */);
						}
					});
				});
			} catch (e) {
				renderForm("Error: " + e.toString());
			}
		});
		return;
	}

	renderForm("");

}).listen(1337, "0.0.0.0", 511, function() {
	console.log("Server running at http://127.0.0.1:1337/");
});
