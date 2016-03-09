/*
 * light_ws2812 example
 * Fade LEDs in R, G, B order; demonstrate functions for changing color order.
 *
 * Created: September 6, 2014
 * Author: Windell Oskay (www.evilmadscientist.com)
 */

#include <WS2812.h>

#define outputPin 7  // Digital output pin (default: 7)
#define LEDCount 4   // Number of LEDs to drive


WS2812 LED(LEDCount); 
cRGB value;

void setup() {
  Serial.begin(9600);
  
	LED.setOutput(outputPin);

	/* You may uncomment one of the following three lines to switch 
	to a different data transmission sequence for your addressable LEDs.
	(These functions can be used at any point in your program as needed.)   */

	//LED.setColorOrderRGB();  // Uncomment for RGB color order
	//LED.setColorOrderBRG();  // Uncomment for BRG color order
	LED.setColorOrderGRB();  // Uncomment for GRB color order (Default; will be used if none other is defined.)

  Serial.println("OK");
}

byte hexToInt(byte ch) {
  if ((ch >= 48)  && (ch <= 57)) {
    return ch - 48;
  } else if ((ch >= 65)  && (ch <= 70)) {
    return ch - 55;
  } else {
    return 0; // bad hex char
  }
}

void processBuffer(String str) {
  unsigned int i, c;
  str.toUpperCase();
  while (str.length() % 6 != 0) {
    str += "0";
  }
  c = 0;
  for(i = 0; i < str.length(); i += 6) {
    value.r = (hexToInt(str.charAt(i + 0)) << 4) | hexToInt(str.charAt(i + 1));
    value.g = (hexToInt(str.charAt(i + 2)) << 4) | hexToInt(str.charAt(i + 3));
    value.b = (hexToInt(str.charAt(i + 4)) << 4) | hexToInt(str.charAt(i + 5));
    LED.set_crgb_at(c, value);
    c++;
  }
  value.b = 0; 
  value.g = 0; 
  value.r = 0;
  for(; c < LEDCount; c++) {
    LED.set_crgb_at(c, value);
  }
  Serial.println("Set: " + str);
  LED.sync(); // Sends the data to the LEDs
}

void loop() {
  // Serial expects...
  // RRGGBBRRGGBBRRGGBB...
  // Missing trailing entries = off, side effect, empty string = all off
  while (Serial.available() > 0) {
    String str = Serial.readStringUntil('\n');
    processBuffer(str);
  }
}
