
'use strict';
function ensureMBXPinAPI() {
  Blockly.Python.definitions_['from_machine_import_pin'] = 'from machine import Pin';
  Blockly.Python.definitions_['from_machine_import_adc'] = 'from machine import ADC';

  Blockly.Python.definitions_['mbx_pin_api'] =
`# ===== MBX Pin API (ESP32 MicroPython) =====

# GPIO mapping (from C code)
A0 = 12
A1 = 33
A2 = 39
A4 = 36
A5 = 35   # GPIO35 (input-only)

D0 = 12
D1 = 33

def _map_pin(pin):
    p = int(pin)
    if p == 12: return 0
    if p == 33: return 1
    if p == 39: return 2
    if p == 36: return 3
    if p == 35: return 4
    return -1

def _analog_gpio(idx):
    if idx == 0: return A0
    if idx == 1: return A1
    if idx == 2: return A2
    if idx == 3: return A4
    if idx == 4: return A5
    return idx

def _digital_gpio(idx):
    if idx == 0: return D0
    if idx == 1: return D1
    return idx

def analog(pin):
    gpio = _analog_gpio(_map_pin(pin))
    adc = ADC(Pin(gpio))
    adc.atten(ADC.ATTN_11DB)
    adc.width(ADC.WIDTH_12BIT)
    return adc.read()

def digitalOpen(pin, state):
    gpio = _digital_gpio(_map_pin(pin))
    Pin(gpio, Pin.OUT).value(1 if int(state) else 0)

def digitalIn(pin):
    gpio = _analog_gpio(_map_pin(pin))
    return Pin(gpio, Pin.IN).value()

def digitalIn_Pullup(pin):
    gpio = _analog_gpio(_map_pin(pin))
    return Pin(gpio, Pin.IN, Pin.PULL_UP).value()
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_pin_api', 'mbx_pin', ['from_machine_import_pin', 'from_machine_import_adc']);
}

/* ---------- Generators (original block names kept) ---------- */

Blockly.Python['pin_digital_write'] = function (block) {
  ensureMBXPinAPI();
  const pin = block.getFieldValue('pin');
  const value = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || '0';
  return `digitalOpen(${pin}, ${value})\n`;
};

Blockly.Python['pin_digital_read'] = function (block) {
  ensureMBXPinAPI();
  const pin = block.getFieldValue('pin');
  return [`digitalIn(${pin})`, Blockly.Python.ORDER_NONE];
};

Blockly.Python['pin_analog_read'] = function (block) {
  ensureMBXPinAPI();
  const pin = block.getFieldValue('pin');
  return [`analog(${pin})`, Blockly.Python.ORDER_NONE];
};

Blockly.Python['pin_analog_write'] = function (block) {
  Blockly.Python.definitions_['from_machine_import_pin'] = 'from machine import Pin';
  Blockly.Python.definitions_['from_machine_import_pwm'] = 'from machine import PWM';

  const functionName = Blockly.Python.provideFunction_(
    'pwmWrite',
    [
      'def ' + Blockly.Python.FUNCTION_NAME_PLACEHOLDER_ + '(pin, duty):',
      '  pwm = PWM(Pin(pin))',
      '  pwm.freq(1000)',
      '  pwm.duty_u16(int(duty / 1023 * 65535))'
    ]
  );

  const pin = block.getFieldValue('pin');
  const value = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || '0';
  return `${functionName}(${pin}, ${value})\n`;
};

// Blockly.Python['pin_pulse_in'] = function (block) {
//   Blockly.Python.definitions_['from_machine_import_pin'] = 'from machine import Pin';
//   Blockly.Python.definitions_['from_machine_import_time_pulse_us'] =
//     'from machine import time_pulse_us';

//   const level = block.getFieldValue('value') === "HIGH" ? "1" : "0";
//   const pin = block.getFieldValue('pin');
//   const timeout = Blockly.Python.valueToCode(block, 'timeout', Blockly.Python.ORDER_ATOMIC) || '0';

//   return [`time_pulse_us(Pin(${pin}, Pin.IN), ${level}, ${timeout})`, Blockly.Python.ORDER_NONE];
// };
