'use strict';

function ensureUltrasonicAPI() {
  if (!Blockly || !Blockly.Python) return;

  Blockly.Python.definitions_["import_ultrasonic_machine"] =
    "from machine import Pin, time_pulse_us";
  Blockly.Python.definitions_["import_ultrasonic_time"] =
    "import time";

  Blockly.Python.definitions_["mbx_ultrasonic_api"] =
`# ===== MBX Ultrasonic SONAR API (ESP32 MicroPython) =====
TRIG_PIN = 32
ECHO_PIN = 34

# HC-SR04 spec: ~2 cm min, ~400 cm max
_MIN_CM = 2.0
_MAX_CM = 400.0
# 30 ms covers ~5 m round-trip; prevents long blocking on missed echoes
_ECHO_TIMEOUT_US = 30000

_trig = None
_echo = None
_ultra_inited = False
_last_distance = 0.0

def ultrasonicSetup():
    global _trig, _echo, _ultra_inited
    if _ultra_inited:
        return
    _trig = Pin(TRIG_PIN, Pin.OUT)
    _echo = Pin(ECHO_PIN, Pin.IN)
    _trig.value(0)
    time.sleep_ms(50)   # let the sensor settle
    _ultra_inited = True

def microsecondsToCentimeters(microseconds):
    # speed of sound ~ 343 m/s -> 29 us per cm, divided by 2 for round trip
    return microseconds / 29 / 2

def sonar():
    global _last_distance
    ultrasonicSetup()

    # Clean low, then 10 us trigger pulse (HC-SR04 datasheet)
    _trig.value(0)
    time.sleep_us(5)
    _trig.value(1)
    time.sleep_us(10)
    _trig.value(0)

    # Measure echo high-pulse with a hard timeout
    try:
        duration = time_pulse_us(_echo, 1, _ECHO_TIMEOUT_US)
    except OSError:
        return _last_distance

    # -1 = timed out waiting for pulse start, -2 = timed out during pulse
    if duration < 0:
        return _last_distance

    distance_cm = microsecondsToCentimeters(duration)

    # Reject out-of-range readings instead of streaming garbage
    if distance_cm < _MIN_CM or distance_cm > _MAX_CM:
        return _last_distance

    _last_distance = float(distance_cm)
    return _last_distance
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_ultrasonic_api', 'mbx_sonar', ['import_ultrasonic_machine', 'import_ultrasonic_time']);
}

Blockly.Python["mbx_ultrasonic_read"] = function (block) {
  ensureUltrasonicAPI();
  return ["sonar()", Blockly.Python.ORDER_FUNCTION_CALL];
};