
function ensureDisplayAPI() {
  if (!Blockly || !Blockly.Python) return;

  Blockly.Python.definitions_["import_machine_display"] = "from machine import Pin, SPI";
  Blockly.Python.definitions_["import_time_display"] = "import time";
  Blockly.Python.definitions_["import_struct_display"] = "import ustruct as struct";
  Blockly.Python.definitions_["import_const_display"] = "from micropython import const";

  Blockly.Python.definitions_["mbx_display_api_custom"] =
`# ===== MBX Display API (Custom ST7789 driver - no st7789 module) =====
from machine import Pin, SPI
from micropython import const
import time
import ustruct as struct

# ---- Pin mapping (EDIT to match your wiring) ----
TFT_CS   = 15
TFT_DC   = 2
TFT_RST  = 4
TFT_SCLK = 18
TFT_MOSI = 23
TFT_BL   = -1  # -1 if always on

TFT_W = 240
TFT_H = 240

ST7789_SWRESET = const(0x01)
ST7789_SLPIN   = const(0x10)
ST7789_SLPOUT  = const(0x11)
ST7789_NORON   = const(0x13)
ST7789_INVOFF  = const(0x20)
ST7789_INVON   = const(0x21)
ST7789_DISPON  = const(0x29)
ST7789_CASET   = const(0x2A)
ST7789_RASET   = const(0x2B)
ST7789_RAMWR   = const(0x2C)
ST7789_COLMOD  = const(0x3A)
ST7789_MADCTL  = const(0x36)

COLOR_MODE_65K   = const(0x50)
COLOR_MODE_16BIT = const(0x05)

BLACK   = const(0x0000)
WHITE   = const(0xFFFF)

_ENCODE_PIXEL = ">H"
_ENCODE_POS   = ">HH"
_BUFFER_SIZE  = const(256)

# Rotation tables (some 240x240 panels need offsets)
# Keep as-is, but we will also try fallback offsets in _init_tft().
WIDTH_240 = [
  (240, 240, 0, 0),   # rot 0
  (240, 240, 0, 0),   # rot 1
  (240, 240, 0, 80),  # rot 2 (common on 240x320 panels)
  (240, 240, 80, 0)   # rot 3 (common on 240x320 panels)
]
ROTATIONS = [0x00, 0x60, 0xC0, 0xA0]

def color565(red, green=0, blue=0):
  try:
    red, green, blue = red
  except TypeError:
    pass
  return ((red & 0xf8) << 8) | ((green & 0xfc) << 3) | (blue >> 3)

def color_hex(x):
  try:
    if isinstance(x, str):
      s = x.strip()
      if s.startswith("#"):
        s = s[1:]
      if s.lower().startswith("0x"):
        s = s[2:]
      rgb = int(s, 16) & 0xFFFFFF
    else:
      rgb = int(x) & 0xFFFFFF
  except:
    rgb = 0xFFFFFF
  r = (rgb >> 16) & 0xFF
  g = (rgb >> 8) & 0xFF
  b = (rgb >> 0) & 0xFF
  return color565(r, g, b)

def _encode_pos(x, y):
  return struct.pack(_ENCODE_POS, x, y)

def _encode_pixel(c):
  return struct.pack(_ENCODE_PIXEL, c)

class ST7789:
  def __init__(self, spi, width, height, reset, dc, cs=None, backlight=None, xstart=0, ystart=0, rotation=0):
    if (width, height) != (240, 240):
      raise ValueError("Only 240x240 supported")

    self.width = width
    self.height = height
    self.spi = spi
    self.reset = reset
    self.dc = dc
    self.cs = cs
    self.backlight = backlight
    self._rotation = rotation % 4
    self.xstart = xstart
    self.ystart = ystart

    self.hard_reset()
    self.soft_reset()
    self.sleep_mode(False)
    self._set_color_mode(COLOR_MODE_65K | COLOR_MODE_16BIT)
    time.sleep_ms(50)
    self.rotation(self._rotation)
    self.inversion_mode(True)
    time.sleep_ms(10)
    self._write(ST7789_NORON)
    time.sleep_ms(10)
    if self.backlight is not None:
      try: self.backlight.value(1)
      except: pass
    self.fill(BLACK)
    self._write(ST7789_DISPON)
    time.sleep_ms(120)

  def _write(self, command=None, data=None):
    if self.cs:
      self.cs.off()
    if command is not None:
      self.dc.off()
      self.spi.write(bytes([command]))
    if data is not None:
      self.dc.on()
      self.spi.write(data)
    if self.cs:
      self.cs.on()

  def hard_reset(self):
    if self.cs:
      self.cs.off()
    if self.reset:
      self.reset.on()
    time.sleep_ms(50)
    if self.reset:
      self.reset.off()
    time.sleep_ms(50)
    if self.reset:
      self.reset.on()
    time.sleep_ms(150)
    if self.cs:
      self.cs.on()

  def soft_reset(self):
    self._write(ST7789_SWRESET)
    time.sleep_ms(150)

  def sleep_mode(self, value):
    self._write(ST7789_SLPIN if value else ST7789_SLPOUT)

  def inversion_mode(self, value):
    self._write(ST7789_INVON if value else ST7789_INVOFF)

  def _set_color_mode(self, mode):
    self._write(ST7789_COLMOD, bytes([mode & 0x77]))

  def rotation(self, rotation):
    rotation %= 4
    self._rotation = rotation
    madctl = ROTATIONS[rotation]
    self.width, self.height, self.xstart, self.ystart = WIDTH_240[rotation]
    self._write(ST7789_MADCTL, bytes([madctl]))

  def _set_columns(self, start, end):
    if start <= end <= self.width:
      self._write(ST7789_CASET, _encode_pos(start + self.xstart, end + self.xstart))

  def _set_rows(self, start, end):
    if start <= end <= self.height:
      self._write(ST7789_RASET, _encode_pos(start + self.ystart, end + self.ystart))

  def _set_window(self, x0, y0, x1, y1):
    self._set_columns(x0, x1)
    self._set_rows(y0, y1)
    self._write(ST7789_RAMWR)

  def blit_buffer(self, buffer, x, y, width, height):
    self._set_window(x, y, x + width - 1, y + height - 1)
    self._write(None, buffer)

  def fill_rect(self, x, y, w, h, c):
    if w <= 0 or h <= 0: return
    self._set_window(x, y, x + w - 1, y + h - 1)
    chunks, rest = divmod(w * h, _BUFFER_SIZE)
    px = _encode_pixel(c)
    self.dc.on()
    if chunks:
      data = px * _BUFFER_SIZE
      for _ in range(chunks):
        self._write(None, data)
    if rest:
      self._write(None, px * rest)

  def fill(self, c):
    self.fill_rect(0, 0, self.width, self.height, c)

  def pixel(self, x, y, c):
    if 0 <= x < self.width and 0 <= y < self.height:
      self._set_window(x, y, x, y)
      self._write(None, _encode_pixel(c))

  def hline(self, x, y, length, c):
    self.fill_rect(x, y, length, 1, c)

  def vline(self, x, y, length, c):
    self.fill_rect(x, y, 1, length, c)

  def rect(self, x, y, w, h, c):
    self.hline(x, y, w, c)
    self.hline(x, y + h - 1, w, c)
    self.vline(x, y, h, c)
    self.vline(x + w - 1, y, h, c)

  def line(self, x0, y0, x1, y1, c):
    steep = abs(y1 - y0) > abs(x1 - x0)
    if steep:
      x0, y0 = y0, x0
      x1, y1 = y1, x1
    if x0 > x1:
      x0, x1 = x1, x0
      y0, y1 = y1, y0
    dx = x1 - x0
    dy = abs(y1 - y0)
    err = dx // 2
    ystep = 1 if y0 < y1 else -1
    while x0 <= x1:
      if steep:
        self.pixel(y0, x0, c)
      else:
        self.pixel(x0, y0, c)
      err -= dy
      if err < 0:
        y0 += ystep
        err += dx
      x0 += 1

  def circle(self, x0, y0, r, c):
    f = 1 - r
    ddF_x = 1
    ddF_y = -2 * r
    x = 0
    y = r
    self.pixel(x0, y0 + r, c)
    self.pixel(x0, y0 - r, c)
    self.pixel(x0 + r, y0, c)
    self.pixel(x0 - r, y0, c)
    while x < y:
      if f >= 0:
        y -= 1
        ddF_y += 2
        f += ddF_y
      x += 1
      ddF_x += 2
      f += ddF_x
      self.pixel(x0 + x, y0 + y, c)
      self.pixel(x0 - x, y0 + y, c)
      self.pixel(x0 + x, y0 - y, c)
      self.pixel(x0 - x, y0 - y, c)
      self.pixel(x0 + y, y0 + x, c)
      self.pixel(x0 - y, y0 + x, c)
      self.pixel(x0 + y, y0 - x, c)
      self.pixel(x0 - y, y0 - x, c)

  def fill_circle(self, x0, y0, r, c):
    self.vline(x0, y0 - r, 2*r + 1, c)
    f = 1 - r
    ddF_x = 1
    ddF_y = -2 * r
    x = 0
    y = r
    while x < y:
      if f >= 0:
        y -= 1
        ddF_y += 2
        f += ddF_y
      x += 1
      ddF_x += 2
      f += ddF_x
      self.vline(x0 + x, y0 - y, 2*y + 1, c)
      self.vline(x0 - x, y0 - y, 2*y + 1, c)
      self.vline(x0 + y, y0 - x, 2*x + 1, c)
      self.vline(x0 - y, y0 - x, 2*x + 1, c)

# ---- init once ----
_spi = None
_tft = None

def _init_tft():
  global _spi, _tft
  if _tft is not None:
    return True

  if TFT_BL != -1:
    try:
      Pin(TFT_BL, Pin.OUT).value(1)
    except:
      pass

  if _spi is None:
    # safe speed to avoid spi errors
    try:
      _spi = SPI(2, baudrate=20000000, polarity=0, phase=0,
                 sck=Pin(TFT_SCLK), mosi=Pin(TFT_MOSI))
    except:
      try:
        _spi = SPI(1, baudrate=20000000, polarity=0, phase=0,
                   sck=Pin(TFT_SCLK), mosi=Pin(TFT_MOSI))
      except:
        return False

  rst = Pin(TFT_RST, Pin.OUT)
  dc  = Pin(TFT_DC,  Pin.OUT)
  cs  = Pin(TFT_CS,  Pin.OUT)

  # Rotation fixed to 1
  # Many 240x240 panels work with (xstart=0, ystart=0).
  # Some need offsets (common if driver is 240x320 internally).
  try:
    _tft = ST7789(_spi, TFT_W, TFT_H, rst, dc, cs=cs, backlight=None, rotation=1)
    _tft.fill(BLACK)
    time.sleep_ms(20)
    return True
  except:
    pass

  # Fallback 1: xstart=80, ystart=0 (common for rotation 1 on some 240x240 cutouts)
  try:
    _tft = ST7789(_spi, TFT_W, TFT_H, rst, dc, cs=cs, backlight=None, xstart=80, ystart=0, rotation=1)
    _tft.fill(BLACK)
    time.sleep_ms(20)
    return True
  except:
    pass

  # Fallback 2: xstart=0, ystart=80 (some panels use y offset even on rotation 1)
  try:
    _tft = ST7789(_spi, TFT_W, TFT_H, rst, dc, cs=cs, backlight=None, xstart=0, ystart=80, rotation=1)
    _tft.fill(BLACK)
    time.sleep_ms(20)
    return True
  except:
    _tft = None
    return False

# ---- optional external font modules (only works if you add those .py files) ----
def _get_font(font_name):
  try:
    if font_name == "FONT_SUPERMARKET_20":
      import Supermarket20 as f; return f
    if font_name == "FONT_SUPERMARKET_40":
      import Supermarket40 as f; return f
    if font_name == "FONT_SUPERMARKET_60":
      import Supermarket60 as f; return f
    if font_name == "FONT_SUPERMARKET_120":
      import Supermarket120 as f; return f

    if font_name == "FONT_TH_SARABUN_NEW_20":
      import THSarabunNew20 as f; return f
    if font_name == "FONT_TH_SARABUN_NEW_40":
      import THSarabunNew40 as f; return f
    if font_name == "FONT_TH_SARABUN_NEW_60":
      import THSarabunNew60 as f; return f
    if font_name == "FONT_TH_SARABUN_NEW_80":
      import THSarabunNew80 as f; return f
    if font_name == "FONT_TH_SARABUN_NEW_120":
      import THSarabunNew120 as f; return f
    if font_name == "FONT_TH_SARABUN_NEW_200":
      import THSarabunNew200 as f; return f
  except:
    return None
  return None

# ---- fallback scalable ASCII font (English/ASCII) ----
_FONT5X8 = {
  " ": [0x00,0x00,0x00,0x00,0x00],
  "!": [0x00,0x00,0x5F,0x00,0x00],
  ".": [0x00,0x60,0x60,0x00,0x00],
  ",": [0x00,0x50,0x30,0x00,0x00],
  "-": [0x08,0x08,0x08,0x08,0x08],
  ":": [0x00,0x36,0x36,0x00,0x00],
  "?": [0x02,0x01,0x51,0x09,0x06],
}
_DIG = [
  [0x3E,0x51,0x49,0x45,0x3E],
  [0x00,0x42,0x7F,0x40,0x00],
  [0x42,0x61,0x51,0x49,0x46],
  [0x21,0x41,0x45,0x4B,0x31],
  [0x18,0x14,0x12,0x7F,0x10],
  [0x27,0x45,0x45,0x45,0x39],
  [0x3C,0x4A,0x49,0x49,0x30],
  [0x01,0x71,0x09,0x05,0x03],
  [0x36,0x49,0x49,0x49,0x36],
  [0x06,0x49,0x49,0x29,0x1E],
]
for i, ch in enumerate("0123456789"):
  _FONT5X8[ch] = _DIG[i]

_UP = [
  [0x7E,0x11,0x11,0x11,0x7E], # A
  [0x7F,0x49,0x49,0x49,0x36], # B
  [0x3E,0x41,0x41,0x41,0x22], # C
  [0x7F,0x41,0x41,0x22,0x1C], # D
  [0x7F,0x49,0x49,0x49,0x41], # E
  [0x7F,0x09,0x09,0x09,0x01], # F
  [0x3E,0x41,0x49,0x49,0x7A], # G
  [0x7F,0x08,0x08,0x08,0x7F], # H
  [0x00,0x41,0x7F,0x41,0x00], # I
  [0x20,0x40,0x41,0x3F,0x01], # J
  [0x7F,0x08,0x14,0x22,0x41], # K
  [0x7F,0x40,0x40,0x40,0x40], # L
  [0x7F,0x02,0x0C,0x02,0x7F], # M
  [0x7F,0x04,0x08,0x10,0x7F], # N
  [0x3E,0x41,0x41,0x41,0x3E], # O
  [0x7F,0x09,0x09,0x09,0x06], # P
  [0x3E,0x41,0x51,0x21,0x5E], # Q
  [0x7F,0x09,0x19,0x29,0x46], # R
  [0x46,0x49,0x49,0x49,0x31], # S
  [0x01,0x01,0x7F,0x01,0x01], # T
  [0x3F,0x40,0x40,0x40,0x3F], # U
  [0x1F,0x20,0x40,0x20,0x1F], # V
  [0x3F,0x40,0x38,0x40,0x3F], # W
  [0x63,0x14,0x08,0x14,0x63], # X
  [0x07,0x08,0x70,0x08,0x07], # Y
  [0x61,0x51,0x49,0x45,0x43], # Z
]
for i, ch in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ"):
  _FONT5X8[ch] = _UP[i]
for ch in "abcdefghijklmnopqrstuvwxyz":
  _FONT5X8[ch] = _FONT5X8.get(ch.upper(), _FONT5X8[" "])

def _font_scale_from_name(font_name):
  m = {
    "FONT_SUPERMARKET_20": 2,
    "FONT_SUPERMARKET_40": 3,
    "FONT_SUPERMARKET_60": 4,
    "FONT_SUPERMARKET_120": 7,
    "FONT_TH_SARABUN_NEW_20": 2,
    "FONT_TH_SARABUN_NEW_40": 3,
    "FONT_TH_SARABUN_NEW_60": 4,
    "FONT_TH_SARABUN_NEW_80": 5,
    "FONT_TH_SARABUN_NEW_120": 7,
    "FONT_TH_SARABUN_NEW_200": 10,
  }
  try:
    return int(m.get(font_name, 2))
  except:
    return 2

def _draw_char_scaled(tft, ch, x, y, fg, bg, scale):
  cols = _FONT5X8.get(ch, _FONT5X8[" "])
  for cx in range(5):
    v = cols[cx]
    for cy in range(8):
      on = (v >> cy) & 1
      c = fg if on else bg
      if scale == 1:
        tft.pixel(x + cx, y + cy, c)
      else:
        tft.fill_rect(x + cx*scale, y + cy*scale, scale, scale, c)
  if scale == 1:
    for cy in range(8):
      tft.pixel(x + 5, y + cy, bg)
  else:
    tft.fill_rect(x + 5*scale, y, scale, 8*scale, bg)

def _draw_text_scaled(tft, text, x, y, fg, bg, scale):
  for ch in str(text):
    _draw_char_scaled(tft, ch, x, y, fg, bg, scale)
    x += (6 * scale)

class _MBXDisplay:
  FONT_SUPERMARKET_20  = "FONT_SUPERMARKET_20"
  FONT_SUPERMARKET_40  = "FONT_SUPERMARKET_40"
  FONT_SUPERMARKET_60  = "FONT_SUPERMARKET_60"
  FONT_SUPERMARKET_120 = "FONT_SUPERMARKET_120"

  FONT_TH_SARABUN_NEW_20  = "FONT_TH_SARABUN_NEW_20"
  FONT_TH_SARABUN_NEW_40  = "FONT_TH_SARABUN_NEW_40"
  FONT_TH_SARABUN_NEW_60  = "FONT_TH_SARABUN_NEW_60"
  FONT_TH_SARABUN_NEW_80  = "FONT_TH_SARABUN_NEW_80"
  FONT_TH_SARABUN_NEW_120 = "FONT_TH_SARABUN_NEW_120"
  FONT_TH_SARABUN_NEW_200 = "FONT_TH_SARABUN_NEW_200"

  def fill(self, c):
    if not _init_tft(): return
    try: _tft.fill(int(c))
    except: pass

  def line(self, x1, y1, x2, y2, c):
    if not _init_tft(): return
    try: _tft.line(int(x1), int(y1), int(x2), int(y2), int(c))
    except: pass

  def rect(self, x, y, w, h, c):
    if not _init_tft(): return
    try: _tft.rect(int(x), int(y), int(w), int(h), int(c))
    except: pass

  def fill_rect(self, x, y, w, h, c):
    if not _init_tft(): return
    try: _tft.fill_rect(int(x), int(y), int(w), int(h), int(c))
    except: pass

  def circle(self, x, y, r, c):
    if not _init_tft(): return
    try: _tft.circle(int(x), int(y), int(r), int(c))
    except: pass

  def fill_circle(self, x, y, r, c):
    if not _init_tft(): return
    try: _tft.fill_circle(int(x), int(y), int(r), int(c))
    except: pass

  def text(self, s, x, y, c, font_name=None):
    if not _init_tft(): return
    s = str(s)
    x = int(x); y = int(y); c = int(c)

    # 1) if external font exists, use it
    f = _get_font(font_name) if font_name else None
    if f is not None:
      try:
        _tft.text(f, s, x, y, c, BLACK)
        return
      except:
        pass

    # 2) fallback scalable ASCII font
    scale = _font_scale_from_name(font_name)
    try:
      _draw_text_scaled(_tft, s, x, y, c, BLACK, scale)
    except:
      pass

  # Image format (from the "show image" block):
  # bytes = [w_hi, w_lo, h_hi, h_lo, ...RGB565 big-endian pixels...]
  def image(self, b, x, y):
    if not _init_tft(): return
    try:
      if not isinstance(b, (bytes, bytearray)) or len(b) < 4:
        return
      w = (b[0] << 8) | b[1]
      h = (b[2] << 8) | b[3]
      x = int(x); y = int(y)
      if w <= 0 or h <= 0 or len(b) < 4 + w * h * 2:
        return
      buf = memoryview(b)[4:]  # no copy, saves RAM
      # crop to the screen
      x0 = max(x, 0); y0 = max(y, 0)
      x1 = min(x + w, _tft.width); y1 = min(y + h, _tft.height)
      if x0 >= x1 or y0 >= y1:
        return
      if x0 == x and y0 == y and x1 == x + w and y1 == y + h:
        _tft.blit_buffer(buf, x, y, w, h)
        return
      cw = x1 - x0
      sx = (x0 - x) * 2
      for row in range(y0, y1):
        start = (row - y) * w * 2 + sx
        _tft.blit_buffer(buf[start:start + cw * 2], x0, row, cw, 1)
    except:
      pass

  # Compressed image from the "show image" block (low RAM).
  # rows = one bytes object per image row. Each row is a list of packets:
  #   n >= 0x80 -> repeat next pixel (2 bytes) (n & 0x7F) + 1 times
  #   n <  0x80 -> copy next (n + 1) pixels (2 bytes each)
  def image_rle(self, w, h, rows, x, y):
    if not _init_tft(): return
    try:
      w = int(w); h = int(h); x = int(x); y = int(y)
      x0 = max(x, 0); x1 = min(x + w, _tft.width)
      if w <= 0 or h <= 0 or x0 >= x1:
        return
      buf = bytearray(w * 2)
      mv = memoryview(buf)
      a = (x0 - x) * 2
      b = (x1 - x) * 2
      for r in range(min(h, len(rows))):
        yy = y + r
        if yy < 0:
          continue
        if yy >= _tft.height:
          break
        d = rows[r]
        n = len(d)
        i = 0
        p = 0
        while i < n and p < w * 2:
          c = d[i]
          i += 1
          if c & 0x80:
            k = ((c & 0x7F) + 1) * 2
            mv[p:p + k] = d[i:i + 2] * (k // 2)
            i += 2
          else:
            k = (c + 1) * 2
            mv[p:p + k] = d[i:i + k]
            i += k
          p += k
        _tft.blit_buffer(mv[a:b], x0, yy, x1 - x0, 1)
    except Exception as e:
      print("image error:", e)

  # Same compressed rows, but read from a picture file one row at a time,
  # so the picture uses almost no RAM. File (uploaded by the IDE):
  #   line 1: "<width> <height>", then one line per row (hex of packets)
  def image_file(self, fname, x, y):
    if not _init_tft(): return
    f = None
    try:
      import ubinascii
      f = open(fname, "r")
      wh = f.readline().split()
      w = int(wh[0]); h = int(wh[1]); x = int(x); y = int(y)
      x0 = max(x, 0); x1 = min(x + w, _tft.width)
      if w <= 0 or h <= 0 or x0 >= x1:
        return
      buf = bytearray(w * 2)
      mv = memoryview(buf)
      a = (x0 - x) * 2
      b = (x1 - x) * 2
      for r in range(h):
        line = f.readline()
        if not line:
          break
        yy = y + r
        if yy < 0:
          continue
        if yy >= _tft.height:
          break
        d = ubinascii.unhexlify(line.strip())
        n = len(d)
        i = 0
        p = 0
        while i < n and p < w * 2:
          c = d[i]
          i += 1
          if c & 0x80:
            k = ((c & 0x7F) + 1) * 2
            mv[p:p + k] = d[i:i + 2] * (k // 2)
            i += 2
          else:
            k = (c + 1) * 2
            mv[p:p + k] = d[i:i + k]
            i += k
          p += k
        _tft.blit_buffer(mv[a:b], x0, yy, x1 - x0, 1)
    except Exception as e:
      print("image error:", e)
    finally:
      if f:
        f.close()

display = _MBXDisplay()
# ===== End MBX Display API =====
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_display_api_custom', 'mbx_tft', ['import_machine_display', 'import_time_display', 'import_struct_display', 'import_const_display']);
}

// ------------------------------------------------------------
// GENERATORS (ALL)
// ------------------------------------------------------------

Blockly.Python["display_draw_text"] = function (block) {
  ensureDisplayAPI();

  const value_text =
    Blockly.Python.valueToCode(block, "text", Blockly.Python.ORDER_ATOMIC) || "''";
  const value_x =
    Blockly.Python.valueToCode(block, "x", Blockly.Python.ORDER_ATOMIC) || "0";
  const value_y =
    Blockly.Python.valueToCode(block, "y", Blockly.Python.ORDER_ATOMIC) || "0";
  const value_color =
    Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "'#FFFFFF'";
  const dropdown_font = block.getFieldValue("font") || "FONT_SUPERMARKET_20";

  return `display.text(${value_text}, ${value_x}, ${value_y}, color_hex(${value_color}), display.${dropdown_font})\n`;
};

Blockly.Python["display_draw_line"] = function (block) {
  ensureDisplayAPI();

  const x1 = Blockly.Python.valueToCode(block, "x1", Blockly.Python.ORDER_ATOMIC) || "0";
  const y1 = Blockly.Python.valueToCode(block, "y1", Blockly.Python.ORDER_ATOMIC) || "0";
  const x2 = Blockly.Python.valueToCode(block, "x2", Blockly.Python.ORDER_ATOMIC) || "0";
  const y2 = Blockly.Python.valueToCode(block, "y2", Blockly.Python.ORDER_ATOMIC) || "0";
  const color = Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "'#FFFFFF'";

  return `display.line(${x1}, ${y1}, ${x2}, ${y2}, color_hex(${color}))\n`;
};

Blockly.Python["display_draw_rect"] = function (block) {
  ensureDisplayAPI();

  const x = Blockly.Python.valueToCode(block, "x", Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, "y", Blockly.Python.ORDER_ATOMIC) || "0";
  const w = Blockly.Python.valueToCode(block, "width", Blockly.Python.ORDER_ATOMIC) || "0";
  const h = Blockly.Python.valueToCode(block, "height", Blockly.Python.ORDER_ATOMIC) || "0";
  const color = Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "'#FFFFFF'";
  const fill = block.getFieldValue("fill") || "0";

  if (fill === "1") return `display.fill_rect(${x}, ${y}, ${w}, ${h}, color_hex(${color}))\n`;
  return `display.rect(${x}, ${y}, ${w}, ${h}, color_hex(${color}))\n`;
};

Blockly.Python["display_draw_circle"] = function (block) {
  ensureDisplayAPI();

  const x = Blockly.Python.valueToCode(block, "x", Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, "y", Blockly.Python.ORDER_ATOMIC) || "0";
  const r = Blockly.Python.valueToCode(block, "r", Blockly.Python.ORDER_ATOMIC) || "0";
  const color = Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "'#FFFFFF'";
  const fill = block.getFieldValue("fill") || "0";

  if (fill === "1") return `display.fill_circle(${x}, ${y}, ${r}, color_hex(${color}))\n`;
  return `display.circle(${x}, ${y}, ${r}, color_hex(${color}))\n`;
};

Blockly.Python["display_draw_bitmap"] = function (block) {
  ensureDisplayAPI();

  const image = block.getFieldValue("image") || "";
  const x = Blockly.Python.valueToCode(block, "x", Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, "y", Blockly.Python.ORDER_ATOMIC) || "0";

  // image is text like "\x00\x50..." : [w_hi, w_lo, h_hi, h_lo, RGB565 big-endian...]
  if (!/^(\\x[0-9a-fA-F]{2})+$/.test(image)) return "";
  const bytes = image.split("\\x").filter(a => a.length === 2).map(a => parseInt(a, 16));
  const w = (bytes[0] << 8) | bytes[1];
  const h = (bytes[2] << 8) | bytes[3];
  if (!w || !h || bytes.length < 4 + w * h * 2) return "";

  // Compress each row (run-length), one small bytes object per row so the
  // board never needs one big block of RAM.
  // printable bytes as-is (shorter upload), others as \xNN
  const hex = (arr) => arr.map(v =>
    (v >= 0x20 && v <= 0x7E && v !== 0x22 && v !== 0x5C)
      ? String.fromCharCode(v)
      : "\\x" + (v < 16 ? "0" : "") + v.toString(16)
  ).join("");
  const rows = [];
  for (let r = 0; r < h; r++) {
    const px = [];
    for (let c = 0; c < w; c++) {
      const k = 4 + (r * w + c) * 2;
      px.push((bytes[k] << 8) | bytes[k + 1]);
    }
    const out = [];
    let i = 0;
    while (i < w) {
      let run = 1;
      while (i + run < w && run < 128 && px[i + run] === px[i]) run++;
      if (run >= 2) {
        out.push(0x80 | (run - 1), px[i] >> 8, px[i] & 0xFF);
        i += run;
        continue;
      }
      const start = i;
      let len = 0;
      while (i < w && len < 128) {
        if (i + 1 < w && px[i + 1] === px[i]) break;
        i++;
        len++;
      }
      out.push(len - 1);
      for (let k = start; k < start + len; k++) out.push(px[k] >> 8, px[k] & 0xFF);
    }
    rows.push(out);
  }

  // Normal case: upload the picture as its own file and draw it from flash
  // (uses almost no RAM and keeps main.py small).
  if (typeof mbxAddUploadFile === "function" && typeof mbxHash === "function") {
    const toHex = (arr) => arr.map(v => (v < 16 ? "0" : "") + v.toString(16)).join("");
    const text = `${w} ${h}\n` + rows.map(toHex).join("\n") + "\n";
    const fname = `mbx_img_${mbxHash(text)}.txt`;
    mbxAddUploadFile(fname, text);
    return `display.image_file('${fname}', ${x}, ${y})\n`;
  }

  // Fallback: picture data inside main.py
  return `display.image_rle(${w}, ${h}, (\n  ${rows.map(o => `b"${hex(o)}"`).join(",\n  ")},\n), ${x}, ${y})\n`;
};

Blockly.Python["display_fill"] = function (block) {
  ensureDisplayAPI();

  const color = Blockly.Python.valueToCode(block, "color", Blockly.Python.ORDER_ATOMIC) || "'#000000'";
  return `display.fill(color_hex(${color}))\n`;
};

