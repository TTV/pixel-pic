npm install twitter
npm install serialport
npm install formidable@latest
npm install get-pixels
npm install fs-extra

https://www.npmjs.com/package/twitter
https://github.com/voodootikigod/node-serialport
https://github.com/felixge/node-formidable
https://www.npmjs.com/package/get-pixels
https://github.com/jprichardson/node-fs-extra


Setup the serial and number of LEDs...

On pi, the following...
var comPort = "COM6";
might read something like...
var comPort = "/dev/tty-usbserial1"
