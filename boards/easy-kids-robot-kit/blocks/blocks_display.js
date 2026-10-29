Blockly.defineBlocksWithJsonArray([

  {
    "type": "display_show",
    "message0": "matrix show 2-chars %1",
    "args0": [
      { "type": "input_value", "name": "value" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  },
  {
    "type": "display_scroll",
    "message0": "matrix show scroll %1",
    "args0": [
      { "type": "input_value", "name": "value" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  },
  {
    "type": "display_firework",
    "message0": "matrix Show firework speed %1 ms",
    "args0": [
      { "type": "input_value", "name": "speed", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Firework animation on dot matrix",
    "helpUrl": ""
  },
  {
    "type": "display_rainfall",
    "message0": "matrix Show rainfall frames %1 speed %2 ms",
    "args0": [
      { "type": "input_value", "name": "frames", "check": "Number" },
      { "type": "input_value", "name": "speed", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  },
  {
  "type": "display_dot_at",
  "message0": "matrix Show at x %1 y %2 %3",
  "args0": [
    { "type": "input_value", "name": "x", "check": "Number" },
    { "type": "input_value", "name": "y", "check": "Number" },
    {
      "type": "field_dropdown",
      "name": "on",
      "options": [
        ["on", "1"],
        ["off", "0"]
      ]
    }
  ],
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": "#3498DB",
  "tooltip": "Set one dot and immediately refresh display",
  "helpUrl": ""
},

  {
    "type": "display_arrow",
    "message0": "matrix show arrow %1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "dir",
        "options": [
          ["⬆ forward", "F"],
          ["⬇ backward", "B"],
          ["⬅ left", "L"],
          ["➡ right", "R"]
        ]
      }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Show an arrow (forward, backward, left, right) on the dot matrix",
    "helpUrl": ""
  },

  {
    "type": "display_clear",
    "message0": "matrix clear",
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  },

  // ===== Ported from KidBright32 Display =====
  {
    "type": "display_custom",
    "message0": "matrix show %1 %2",
    "args0": [
      { "type": "input_dummy" },
      { "type": "field_dotmatrix", "name": "value" }
    ],
    "inputsInline": false,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Draw a custom 16x8 picture on the dot matrix",
    "helpUrl": ""
  },
  {
    "type": "display_show4x8",
    "message0": "matrix show number %1",
    "args0": [
      { "type": "input_value", "name": "value" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Show a number up to 4 digits (-999 to 9999)",
    "helpUrl": ""
  },
  {
    "type": "display_left_show",
    "message0": "matrix left show number %1",
    "args0": [
      { "type": "input_value", "name": "value", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Show a number (-9 to 99) on the left half of the matrix",
    "helpUrl": ""
  },
  {
    "type": "display_right_show",
    "message0": "matrix right show number %1",
    "args0": [
      { "type": "input_value", "name": "value", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Show a number (-9 to 99) on the right half of the matrix",
    "helpUrl": ""
  },
  {
    "type": "display_plot",
    "message0": "matrix plot %1",
    "args0": [
      { "type": "input_value", "name": "value", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "Plot a value 0-100 as a scrolling bar graph",
    "helpUrl": ""
  },
  {
    "type": "display_dot_show",
    "message0": "matrix dot at %1 (x: %2 , y: %3) turn on",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_value", "name": "x", "check": "Number" },
      { "type": "input_value", "name": "y", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  },
  {
    "type": "display_dot_hide",
    "message0": "matrix dot at %1 (x: %2 , y: %3) turn off",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_value", "name": "x", "check": "Number" },
      { "type": "input_value", "name": "y", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#3498DB",
    "tooltip": "",
    "helpUrl": ""
  }
]);
