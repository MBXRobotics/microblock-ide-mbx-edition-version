/* global Blockly */

Blockly.defineBlocksWithJsonArray([
{
  "type": "pin_digital_write",
  "message0": "digitalWrite %1 to pin %2",
  "args0": [
    {
      "type": "input_value",
      "name": "value",
      "check": ["Boolean", "Number"]
    },
    {
      "type": "field_dropdown",
      "name": "pin",
      "options": [
        [ "D0", "12" ],   // GPIO12
        [ "D1", "33" ]    // GPIO33
      ]
    }
  ],
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": "#1f5053"
},

{
  "type": "pin_digital_read",
  "message0": "digitalRead pin %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "pin",
      "options": [
        [ "AD0 warning pin", "12" ],
        [ "AD1", "33" ],
        [ "AD2", "39" ],     
        [ "AD3", "36" ]
      ]
    }
  ],
  "output": ["Number", "Boolean"],
  "inputsInline": true,
  "colour": "#1f5053"
},

{
  "type": "pin_analog_read",
  "message0": "analogRead pin %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "pin",
      "options": [
        [ "A0", "12" ],
        [ "A1", "33" ],
        [ "A2", "39" ],
        [ "A3", "36" ], 
        [ "VR", "35" ]
      ]
    }
  ],
  "output": "Number",
  "inputsInline": true,
  "colour": "#1f5053",
  "tooltip": "Read analog value from pin"
},

{
  "type": "pin_analog_write",
  "message0": "analogWritePWM %1 to pin %2",
  "args0": [
    {
      "type": "input_value",
      "name": "value",
      "check": "Number"
    },
    {
      "type": "field_dropdown",
      "name": "pin",
      "options": [
        [ "D0", "12" ],
        [ "D1", "33" ]
      ]
    }
  ],
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": "#1f5053"
},

// {
//   "type": "pin_pulse_in",
//   "message0": "reads a pulse %1 on a pin %2 timeout %3 uS",
//   "args0": [
//     {
//       "type": "field_dropdown",
//       "name": "value",
//       "options": [
//         [ "HIGH", "HIGH" ],
//         [ "LOW", "LOW" ]
//       ]
//     },
//     {
//       "type": "field_dropdown",
//       "name": "pin",
//       "options": [
//         [ "D0", "12" ],
//         [ "D1", "33" ],
//         [ "A2", "39" ],
//         [ "A4", "36" ],
//         [ "VR", "35" ]
//       ]
//     },
//     {
//       "type": "input_value",
//       "name": "timeout",
//       "check": "Number"
//     }
//   ],
//   "output": ["Number", "Boolean"],
//   "inputsInline": true,
//   "colour": "#1f5053"
// }
]);
