// =====================================================
// MBX UART generators (ported from the EasyKids edition)
// =====================================================

// MBX header pins (EasyKids used 26/13, which are motor pins on MBX)
const MBX_UART_PINS = { A0: 12, A1: 33 };

function ensureMBXUartAPI() {
  Blockly.Python.definitions_['serial_import_uart'] = 'from machine import UART, Pin';
  Blockly.Python.definitions_['serial_uart_api'] =
`# ===== MBX UART API =====
uart = None

def _serial_begin(baud, tx, rx):
    global uart
    try:
        uart = UART(1, baudrate=baud, tx=tx, rx=rx)
    except Exception as e:
        uart = None
        print("UART error:", e)

def _serial_read_data():
    try:
        if uart is None:
            return ""
        line = uart.readline()
        if not line:
            return ""
        if isinstance(line, bytes):
            try:
                s = line.decode().strip()
            except:
                s = ''.join('{:02X}'.format(b) for b in line)
        else:
            s = str(line).strip()
        try:
            try:
                import ujson as json
            except:
                import json
            return json.loads(s)
        except:
            pass
        try:
            if any(ch in s for ch in ('.', 'e', 'E')):
                return float(s)
            return int(s)
        except:
            pass
        return s
    except:
        return ""

def _serial_read_float():
    v = _serial_read_data()
    try:
        return float(v)
    except:
        return 0.0

# each message ends with a new line, so "Read Data" gets one message per read
def _serial_send(val):
    try:
        if uart is None:
            return
        if isinstance(val, (bytes, bytearray)):
            uart.write(val)
        else:
            uart.write(str(val) + chr(10))
    except:
        pass
# ===== End MBX UART API =====`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('serial_uart_api', 'mbx_uart', ['serial_import_uart'], ['_serial_begin', '_serial_read_data', '_serial_read_float', '_serial_send']);
}

Blockly.Python['serial_begin_rxtx'] = function (block) {
  ensureMBXUartAPI();
  const rx = MBX_UART_PINS[block.getFieldValue('RX')] ?? MBX_UART_PINS.A1;
  const tx = MBX_UART_PINS[block.getFieldValue('TX')] ?? MBX_UART_PINS.A0;
  const baud = parseInt(block.getFieldValue('BAUD'), 10) || 115200;
  return `_serial_begin(${baud}, ${tx}, ${rx})\n`;
};

Blockly.Python['serial_read_auto'] = function (block) {
  ensureMBXUartAPI();
  return ['_serial_read_data()', Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python['serial_read_data_float'] = function (block) {
  ensureMBXUartAPI();
  return ['_serial_read_float()', Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python['serial_send'] = function (block) {
  ensureMBXUartAPI();
  const value = Blockly.Python.valueToCode(block, 'VALUE', Blockly.Python.ORDER_ATOMIC) || '""';
  return `_serial_send(${value})\n`;
};
