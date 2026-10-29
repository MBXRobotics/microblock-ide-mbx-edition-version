
function ensureMotorAPI() {
  // own key: must not replace "import machine" used by Blynk / sleep / reset blocks
  Blockly.Python.definitions_['import_machine_pin_pwm'] = 'from machine import Pin, PWM';
  Blockly.Python.definitions_['import_time'] = 'import time';

  Blockly.Python.definitions_['mbx_motor_api_minimal'] =
`# ===== MBX Motor API (2-wheel TB6612) =====

# Pin mapping (from Arduino code)
PWMA = 25
AIN1 = 17
AIN2 = 19

PWMB = 26
BIN1 = 5
BIN2 = 14

STBY = 13

# Setup pins
ain1 = Pin(AIN1, Pin.OUT)
ain2 = Pin(AIN2, Pin.OUT)
bin1 = Pin(BIN1, Pin.OUT)
bin2 = Pin(BIN2, Pin.OUT)
stby = Pin(STBY, Pin.OUT)

# Setup PWM (ESP32 MicroPython duty: 0..1023)
pwmA = PWM(Pin(PWMA), freq=5000, duty=0)
pwmB = PWM(Pin(PWMB), freq=5000, duty=0)

# Enable motor driver
stby.value(1)

MIN_DUTY = 200
MAX_DUTY = 1023
DEADZONE = 5

def _speed_to_duty(speed):
    speed = abs(int(speed))
    if speed == 0:
        return 0
    speed = max(1, min(100, speed))
    return int(MIN_DUTY + (MAX_DUTY - MIN_DUTY) * speed / 100)

def _motor(num, speed):
    # num: 1 or 2
    # speed: -100..100
    try:
        speed = int(speed)
    except:
        speed = 0

    if abs(speed) < DEADZONE:
        speed = 0

    speed = max(-100, min(100, speed))
    duty = _speed_to_duty(speed)

    if num == 1:
        in1, in2, pwm = ain1, ain2, pwmA
    else:
        in1, in2, pwm = bin1, bin2, pwmB

    if speed > 0:
        in1.value(1)
        in2.value(0)
        pwm.duty(duty)
    elif speed < 0:
        in1.value(0)
        in2.value(1)
        pwm.duty(duty)
    else:
        in1.value(0)
        in2.value(0)
        pwm.duty(0)

class _Motor:
    def forward(self, speed, t=0):
        _motor(1, speed)
        _motor(2, speed)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def backward(self, speed, t=0):
        _motor(1, -speed)
        _motor(2, -speed)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def turn_left(self, speed, t=0):
        _motor(1, 0)
        _motor(2, speed)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def turn_right(self, speed, t=0):
        _motor(1, speed)
        _motor(2, 0)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def spin_left(self, speed, t=0):
        try:
            speed = int(speed)
        except:
            speed = 0
        speed = max(speed, 35)  # minimum for spin
        _motor(1, -speed)
        _motor(2, speed)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def spin_right(self, speed, t=0):
        try:
            speed = int(speed)
        except:
            speed = 0
        speed = max(speed, 35)  # minimum for spin
        _motor(1, speed)
        _motor(2, -speed)
        if t and t > 0:
            time.sleep(float(t))
            self.stop()

    def stop(self):
        pwmA.duty(0)
        pwmB.duty(0)
        ain1.value(0)
        ain2.value(0)
        bin1.value(0)
        bin2.value(0)

    # -------------------------------------------------------
    # ✅ motor_wheel block (ONLY M1 and M2)
    # Recommend mapping:
    # - M1 = left motor power (-100..100)
    # - M2 = right motor power (-100..100)
    # -------------------------------------------------------
    def set_wheel(self, m1, m2):
        try:
            left = int(float(m1))
        except:
            left = 0
        try:
            right = int(float(m2))
        except:
            right = 0
        _motor(1, left)
        _motor(2, right)

    # -------------------------------------------------------
    # ✅ motor_move dropdown support
    # For 2-wheel robot:
    # - SLIDE_LEFT/RIGHT are mapped to TURN_LEFT/RIGHT
    # -------------------------------------------------------
    def move(self, direction, power, t=0):
        try:
            p = int(power)
        except:
            p = 0

        if direction == FORWARD:
            self.forward(p, t)
        elif direction == BACKWARD:
            self.backward(p, t)
        elif direction == TURN_LEFT:
            self.turn_left(p, t)
        elif direction == TURN_RIGHT:
            self.turn_right(p, t)
        elif direction == SPIN_LEFT:
            self.spin_left(p, t)
        elif direction == SPIN_RIGHT:
            self.spin_right(p, t)
        elif direction == SLIDE_LEFT:
            self.turn_left(p, t)   # 2-wheel fallback
        elif direction == SLIDE_RIGHT:
            self.turn_right(p, t)  # 2-wheel fallback
        else:
            self.stop()

# Direction constants (so dropdown values like motor.FORWARD can be used)
FORWARD = 0
BACKWARD = 1
TURN_LEFT = 2
TURN_RIGHT = 3
SPIN_LEFT = 4
SPIN_RIGHT = 5
SLIDE_LEFT = 6
SLIDE_RIGHT = 7

motor = _Motor()
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_motor_api_minimal', 'mbx_motor', ['import_machine_pin_pwm', 'import_time']);
}

// ----------------- BLOCK GENERATORS -----------------

Blockly.Python['motor_forward'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.forward(${speed}, ${t})\n`;
};

Blockly.Python['motor_backward'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.backward(${speed}, ${t})\n`;
};

Blockly.Python['motor_turn_left'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.turn_left(${speed}, ${t})\n`;
};

Blockly.Python['motor_turn_right'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.turn_right(${speed}, ${t})\n`;
};

Blockly.Python['motor_spin_left'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.spin_left(${speed}, ${t})\n`;
};

Blockly.Python['motor_spin_right'] = function(block) {
  ensureMotorAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  const t = Blockly.Python.valueToCode(block, 'time', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.spin_right(${speed}, ${t})\n`;
};

Blockly.Python['motor_stop'] = function(block) {
  ensureMotorAPI();
  return `motor.stop()\n`;
};

// -----------------------------------------------------
// ✅ motor_move block (dropdown direction + power)
// Dropdown values are like "motor.FORWARD" in JSON.
// We convert to "FORWARD" to match Python constants.
// -----------------------------------------------------
Blockly.Python['motor_move'] = function(block) {
  ensureMotorAPI();

  let dir = block.getFieldValue('move') || 'motor.FORWARD';
  dir = dir.replace(/^motor\./, ''); // "motor.FORWARD" -> "FORWARD"

  const power = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.move(${dir}, ${power}, 0)\n`;
};



// ✅ motor_wheel block (ONLY M1 + M2)
// Calls motor.set_wheel(m1, m2)
// -----------------------------------------------------
Blockly.Python['motor_wheel'] = function(block) {
  ensureMotorAPI();
  const s1 = Blockly.Python.valueToCode(block, 'speed1', Blockly.Python.ORDER_ATOMIC) || '0';
  const s2 = Blockly.Python.valueToCode(block, 'speed2', Blockly.Python.ORDER_ATOMIC) || '0';
  return `motor.set_wheel(${s1}, ${s2})\n`;
};
