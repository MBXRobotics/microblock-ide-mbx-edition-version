
function ensureRGBLedAPI() {
  if (!Blockly || !Blockly.Python) return;

  Blockly.Python.definitions_["import_neopixel_rgb"] =
    "from machine import Pin\nimport neopixel\nimport time";

  Blockly.Python.definitions_["mbx_rgbled_api"] =
`# ===== MBX RGB LED API (ESP32 MicroPython / NeoPixel) =====


RGB_PIN = 33
RGB_COUNT = 14

_np = neopixel.NeoPixel(Pin(RGB_PIN, Pin.OUT), RGB_COUNT)
_brightness = 255


def _clamp(v, lo, hi):
    try:
        v = int(v)
    except:
        v = lo
    if v < lo: v = lo
    if v > hi: v = hi
    return v

def _strip_quotes(s):
    if len(s) >= 2 and ((s[0] == "'" and s[-1] == "'") or (s[0] == '"' and s[-1] == '"')):
        return s[1:-1]
    return s

def _parse_color(c):
    if isinstance(c, str):
        s = _strip_quotes(c.strip())
        if s.startswith("#"):
            s = s[1:]
        if s.lower().startswith("0x"):
            s = s[2:]
        try:
            return int(s, 16)
        except:
            return 0
    try:
        return int(c)
    except:
        return 0

def _color24_to_rgb_tuple(c):
    c = _parse_color(c)
    r = (c >> 16) & 0xFF
    g = (c >> 8) & 0xFF
    b = c & 0xFF
    return (r, g, b)  # RGB order

def set_brightness(bright_0_255):
    global _brightness
    _brightness = _clamp(bright_0_255, 0, 255)

def _apply_brightness(rgb):
    r, g, b = rgb
    if _brightness >= 255:
        return (r, g, b)
    return (r * _brightness // 255, g * _brightness // 255, b * _brightness // 255)

def show():
    _np.write()

def clear():
    for i in range(RGB_COUNT):
        _np[i] = (0, 0, 0)
    _np.write()

def set_color(n, color):
    n = _clamp(n, 0, RGB_COUNT - 1)
    rgb = _apply_brightness(_color24_to_rgb_tuple(color))
    _np[n] = rgb

def fill(color):
    rgb = _apply_brightness(_color24_to_rgb_tuple(color))
    for i in range(RGB_COUNT):
        _np[i] = rgb


def _wheel(pos):
    pos = pos % 256
    if pos < 85:
        return (255 - pos * 3, pos * 3, 0)
    if pos < 170:
        pos -= 85
        return (0, 255 - pos * 3, pos * 3)
    pos -= 170
    return (pos * 3, 0, 255 - pos * 3)

def rainbow(wait_ms=30):
    try:
        wait_ms = int(wait_ms)
    except:
        wait_ms = 30
    if wait_ms < 0:
        wait_ms = 0

    for j in range(256):
        for i in range(RGB_COUNT):
            rgb = _wheel(i * 256 // RGB_COUNT + j)
            _np[i] = _apply_brightness(rgb)
        _np.write()
        time.sleep_ms(wait_ms)

class _RGB:
    def set_color(self, n, color): set_color(n, color)
    def fill(self, color): fill(color)
    def show(self): show()
    def clear(self): clear()
    def rainbow(self, wait): rainbow(wait)
    def set_brightness(self, bright): set_brightness(bright)

rgbled = _RGB()
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_rgbled_api', 'mbx_rgbled', ['import_neopixel_rgb']);
}

// ----------------- BLOCK GENERATORS -----------------

Blockly.Python["rgbled_set_color"] = function (block) {
  ensureRGBLedAPI();
  const n =
    Blockly.Python.valueToCode(block, "n", Blockly.Python.ORDER_ATOMIC) || "0";
  const color =
    Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "0";
  return `rgbled.set_color(${n}, ${color})\n`;
};

Blockly.Python["rgbled_fill_color"] = function (block) {
  ensureRGBLedAPI();
  const color =
    Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "0";
  return `rgbled.fill(${color})\n`;
};

Blockly.Python["rgbled_show"] = function () {
  ensureRGBLedAPI();
  return `rgbled.show()\n`;
};

Blockly.Python["rgbled_clear"] = function () {
  ensureRGBLedAPI();
  return `rgbled.clear()\n`;
};

Blockly.Python["rgbled_rainbow"] = function (block) {
  ensureRGBLedAPI();
  const wait =
    Blockly.Python.valueToCode(block, "wait", Blockly.Python.ORDER_ATOMIC) || "30";
  return `rgbled.rainbow(${wait})\n`;
};

Blockly.Python["rgbled_set_brightness"] = function (block) {
  ensureRGBLedAPI();
  const brightnessPct =
    Blockly.Python.valueToCode(block, "brightness", Blockly.Python.ORDER_ATOMIC) || "100";
  return `rgbled.set_brightness(int(max(0, min(100, (${brightnessPct}))) * 255 / 100))\n`;
};
