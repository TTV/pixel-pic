CD into this folder then type...

npm install

Edit the pic.js to...
Use your specific serial port that the arduino is connected to (default = COM6). Raspberry PI is something like "/dev/tty-usbserial1"
Set the width and height of your picture frame

Start the server with...

node pic.js

Open a browser (on the same machine is easiest), point to http://127.0.0.1:1337 and have fun

Used packages
-------------
https://github.com/voodootikigod/node-serialport
https://github.com/felixge/node-formidable
https://www.npmjs.com/package/get-pixels
https://github.com/jprichardson/node-fs-extra

Thx, @TTV69