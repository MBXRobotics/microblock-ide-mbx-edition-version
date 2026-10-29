
function ensureServoAPI() {
  // Safety: make sure Blockly.Python exists
  if (!Blockly || !Blockly.Python) return;

  Blockly.Python.definitions_["import_machine_servo"] = "from machine import Pin, PWM";

  Blockly.Python.definitions_["mbx_servo_api"] =
`# ===== MBX Servo API (ESP32 MicroPython) =====
SERVO1_PIN = 27
SERVO_MIN_US = 500
SERVO_MAX_US = 2500
SERVO_FREQ = 50

_servo_pwm = None

def _servo_init():
    global _servo_pwm
    if _servo_pwm is None:
        _servo_pwm = PWM(Pin(SERVO1_PIN), freq=SERVO_FREQ, duty=0)

def _us_to_duty(us):
    # ESP32 MicroPython duty range: 0..1023
    # period_us = 1e6 / freq = 20000us at 50Hz
    period_us = int(1000000 / SERVO_FREQ)
    us = max(0, min(period_us, int(us)))
    return int(us * 1023 / period_us)

def servo_write(ch, angle):
    # Only channel 1 supported (SV1)
    try:
        ch = int(ch)
    except:
        ch = 1
    if ch != 1:
        return

    _servo_init()

    try:
        a = int(angle)
    except:
        a = 90

    if a < 0: a = 0
    if a > 180: a = 180

    us = SERVO_MIN_US + (SERVO_MAX_US - SERVO_MIN_US) * a // 180
    _servo_pwm.duty(_us_to_duty(us))

def servo_detach(ch=1):
    global _servo_pwm
    if _servo_pwm is not None:
        try:
            _servo_pwm.deinit()
        except:
            pass
        _servo_pwm = None
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_servo_api', 'mbx_servo', ['import_machine_servo']);
}

// ----------------- BLOCK GENERATOR -----------------
// Block: external_servo
// Dropdown: ch = "SV1" (only one)
// Input: angle
Blockly.Python["external_servo"] = function (block) {
  ensureServoAPI();

  // If you keep dropdown:
  const chRaw = block.getFieldValue("ch") || "SV1"; // "SV1"
  const chNum = ("" + chRaw).replace(/^SV/i, "");   // "SV1" -> "1"

  const angle =
    Blockly.Python.valueToCode(block, "angle", Blockly.Python.ORDER_ATOMIC) || "90";

  return `servo_write(${chNum}, ${angle})\n`;
};

