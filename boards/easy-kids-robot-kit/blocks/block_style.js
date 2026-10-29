// =====================================================
// MBX block style: small icon at the start of each block
// (same look as the EasyKids edition of microBlock IDE).
// Only adds an 18x18 picture. Colours, text, inputs and
// generated code are not changed. Load this file LAST.
// =====================================================
(function () {
  const R = (typeof rootPath !== "undefined") ? rootPath : "";
  const B = `${R}/boards/easy-kids-robot-kit/images`;

  const ICON = {
    io:      `${R}/images/icon/IO.png`,
    io_mbx:  `${R}/images/icon/IO.png`,
    control: `${R}/images/icon/process.png`,
    moving:  `${B}/Moving.png`,
    rgb:     `${B}/rgb.png`,
    gamepad: `${B}/gamepad.png`,
    servo:   `${B}/servo.png`,
    display: `${R}/boards/ttgo-t-display/images/display.png`,
    matrix:  `${R}/boards/kidbright32/images/matrix.png`,
    note:    `${R}/boards/kidbright32/images/itunes-note-brands.svg`,
  };

  const BLOCK_ICONS = {
    // ----- same as EasyKids -----
    moving: [
      "motor_forward", "motor_backward", "motor_turn_left", "motor_turn_right",
      "motor_spin_left", "motor_spin_right", "motor_move", "motor_wheel", "motor_stop",
    ],
    rgb: [
      "rgbled_set_color", "rgbled_fill_color", "rgbled_show", "rgbled_clear",
      "rgbled_rainbow", "rgbled_set_brightness", "colour_random", "colour_rgb",
    ],
    gamepad: [
      "gamepad_is_connected", "gamepad_forget_keys", "gamepad_enable_new_bluetooth_connections",
      "gamepad_axis", "gamepad_button_is_press", "gamepad_temperature", "gamepad_battery_level",
    ],
    display: [
      "display_draw_text", "display_draw_line", "display_draw_rect",
      "display_draw_circle", "display_fill", "display_draw_bitmap",
    ],
    io: [
      "pin_digital_write", "pin_digital_read", "pin_analog_read", "pin_analog_write",
      "switch_is_press", "switch_is_release", "switch_get_value",
      "buzzer_tone", "buzzer_notes", "buzzer_volume",
    ],
    note: ["make_note"],
    servo: ["external_servo"],
    control: [
      "controls_wait", "controls_wait_ms", "controls_wait_us", "controls_repeat_ext",
      "controls_if", "controls_wait_until", "controls_forever", "controls_whileUntil",
      "controls_for", "while_loop", "controls_flow_statements",
    ],

    // ----- MBX-only blocks, same style -----
    io_mbx: ["mbx_ultrasonic_read", "switch_on_pressed"],
    matrix: [
      "display_show", "display_scroll", "display_firework", "display_rainfall",
      "display_dot_at", "display_arrow", "display_clear", "display_custom",
      "display_show4x8", "display_left_show", "display_right_show", "display_plot",
      "display_dot_show", "display_dot_hide",
    ],
  };

  for (const [iconName, types] of Object.entries(BLOCK_ICONS)) {
    const src = ICON[iconName];
    for (const type of types) {
      const def = Blockly.Blocks[type];
      if (!def || typeof def.init !== "function" || def.__mbxIcon) continue;
      const init = def.init;
      def.init = function () {
        init.apply(this, arguments);
        try {
          const input = this.inputList[0];
          const first = input && input.fieldRow[0];
          if (input && !(first instanceof Blockly.FieldImage)) {
            input.insertFieldAt(0, new Blockly.FieldImage(src, 18, 18, "*"));
          }
        } catch (e) {
          console.warn("block_style:", type, e);
        }
      };
      def.__mbxIcon = true;
    }
  }
})();
