// =====================================================
// MBX UART blocks (ported from the EasyKids edition)
// A0 = GPIO12, A1 = GPIO33 (MBX header pins)
// =====================================================
const SERIAL_ICON = `${typeof rootPath !== "undefined" ? rootPath : ""}/boards/easy-kids-robot-kit/images/serial-terminal.png`;

Blockly.defineBlocksWithJsonArray([
  {
    "type": "serial_begin_rxtx",
    "message0": "%1 Start Serial RX %2 TX %3 Baudrate %4",
    "args0": [
      { "type": "field_image", "src": SERIAL_ICON, "width": 18, "height": 18, "alt": "*" },
      {
        "type": "field_dropdown",
        "name": "RX",
        "options": [
          ["A0", "A0"],
          ["A1", "A1"]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "TX",
        "options": [
          ["A1", "A1"],
          ["A0", "A0"]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "BAUD",
        "options": [
          ["9600", "9600"],
          ["19200", "19200"],
          ["38400", "38400"],
          ["57600", "57600"],
          ["115200", "115200"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "#16a085",
    "tooltip": "Start UART. A0 = GPIO12, A1 = GPIO33. Tip: use A1 for RX (GPIO12 must not be held high while the board starts). A1 is also the RGB LED pin.",
    "helpUrl": ""
  },
  {
    "type": "serial_read_auto",
    "message0": "%1 Read Data",
    "args0": [
      { "type": "field_image", "src": SERIAL_ICON, "width": 18, "height": 18, "alt": "*" }
    ],
    "output": null,
    "inputsInline": true,
    "colour": "#16a085",
    "tooltip": "Read one line from UART and convert it automatically: JSON / int / float / text. Returns \"\" if nothing arrived.",
    "helpUrl": ""
  },
  {
    "type": "serial_read_data_float",
    "message0": "%1 Read Data Float",
    "args0": [
      { "type": "field_image", "src": SERIAL_ICON, "width": 18, "height": 18, "alt": "*" }
    ],
    "output": "Number",
    "inputsInline": true,
    "colour": "#16a085",
    "tooltip": "Read one line from UART as a decimal number (0 if nothing arrived or not a number)",
    "helpUrl": ""
  },
  {
    "type": "serial_send",
    "message0": "%1 Send Data %2",
    "args0": [
      { "type": "field_image", "src": SERIAL_ICON, "width": 18, "height": 18, "alt": "*" },
      { "type": "input_value", "name": "VALUE", "check": ["Number", "String"] }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "#16a085",
    "tooltip": "Send a number or text through UART (a new line is added at the end of each message)",
    "helpUrl": ""
  }
]);
