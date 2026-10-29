'use strict';

// =====================================================
// MBX DotMatrix (HT16K33 16x8) - generators_display.js
// Full generator file (includes display_dot_at support)
// =====================================================

function ensureMBXDotMatrixAPI() {
  // ✅ Safety: don't crash if Python generator isn't ready yet
  if (!Blockly || !Blockly.Python) return;

  // Imports once
  Blockly.Python.definitions_['import_machine_i2c'] =
`from machine import Pin, I2C
import time
import urandom`;

  // Driver once
  Blockly.Python.definitions_['mbx_dotmatrix_driver'] =
`# ===== MBX DotMatrix Driver (ported 1:1 from Arduino C) =====
HT16K33_ADDR = 0x70
SCROLL_MAX_CHARS = 10

SDA_PIN = 21
SCL_PIN = 22

fb = bytearray(16)

def _i2c_init():
    for bus in (0, 1):
        try:
            i2c = I2C(bus, scl=Pin(SCL_PIN), sda=Pin(SDA_PIN), freq=400000)
            if HT16K33_ADDR in i2c.scan():
                return i2c
        except:
            pass
    return I2C(0, scl=Pin(SCL_PIN), sda=Pin(SDA_PIN), freq=400000)

_i2c = _i2c_init()

def cmd(c):
    try:
        _i2c.writeto(HT16K33_ADDR, bytes([c & 0xFF]))
    except:
        pass

def dotClear():
    for i in range(16):
        fb[i] = 0

def dotShow():
    try:
        _i2c.writeto(HT16K33_ADDR, b'\\x00' + fb)
    except:
        pass

def dotSetBrightness(bright):
    b = int(bright)
    if b > 15: b = 15
    if b < 0:  b = 0
    cmd(0xE0 | b)

def dotmatrixSetup():
    cmd(0x21)
    cmd(0x81)
    dotSetBrightness(2)
    dotClear()
    dotShow()

def setPixel(comX, rowY, on):
    if comX > 7 or rowY > 15:
        return
    addr = comX * 2 + (1 if rowY >= 8 else 0)
    bit = (rowY - 8) if rowY >= 8 else rowY
    mask = 1 << bit
    if on:
        fb[addr] |= mask
    else:
        fb[addr] &= (0xFF ^ mask)

def dotS(row, col, on):
    if row > 7 or col > 15:
        return
    yy = 7 - row
    xx = col
    if xx < 8:
        setPixel(xx, yy, on)
    else:
        setPixel(xx - 8, yy + 8, on)

# ✅ This is your Arduino function:
def dotShowAt(row, col, on):
    dotS(int(row), int(col), bool(on))
    dotShow()

# ===== Glyphs =====
DIG0 = [0x3E, 0x51, 0x49, 0x45, 0x3E]
DIG1 = [0x00, 0x42, 0x7F, 0x40, 0x00]
DIG2 = [0x62, 0x51, 0x49, 0x49, 0x46]
DIG3 = [0x22, 0x41, 0x49, 0x49, 0x36]
DIG4 = [0x18, 0x14, 0x12, 0x7F, 0x10]
DIG5 = [0x2F, 0x49, 0x49, 0x49, 0x31]
DIG6 = [0x3E, 0x49, 0x49, 0x49, 0x32]
DIG7 = [0x01, 0x71, 0x09, 0x05, 0x03]
DIG8 = [0x36, 0x49, 0x49, 0x49, 0x36]
DIG9 = [0x26, 0x49, 0x49, 0x49, 0x3E]

A = [0x7E, 0x11, 0x11, 0x11, 0x7E]
B = [0x7F, 0x49, 0x49, 0x49, 0x36]
C = [0x3E, 0x41, 0x41, 0x41, 0x22]
D = [0x7F, 0x41, 0x41, 0x22, 0x1C]
E = [0x7F, 0x49, 0x49, 0x49, 0x41]
F = [0x7F, 0x09, 0x09, 0x09, 0x01]
G = [0x3E, 0x41, 0x49, 0x49, 0x7A]
H = [0x7F, 0x08, 0x08, 0x08, 0x7F]
I = [0x00, 0x41, 0x7F, 0x41, 0x00]
J = [0x20, 0x40, 0x41, 0x3F, 0x01]
K = [0x7F, 0x08, 0x14, 0x22, 0x41]
L = [0x7F, 0x40, 0x40, 0x40, 0x40]
M = [0x7F, 0x02, 0x0C, 0x02, 0x7F]
N = [0x7F, 0x04, 0x08, 0x10, 0x7F]
O = [0x3E, 0x41, 0x41, 0x41, 0x3E]
P = [0x7F, 0x09, 0x09, 0x09, 0x06]
Q = [0x3E, 0x41, 0x51, 0x21, 0x5E]
R = [0x7F, 0x09, 0x19, 0x29, 0x46]
S = [0x46, 0x49, 0x49, 0x49, 0x31]
T = [0x01, 0x01, 0x7F, 0x01, 0x01]
U = [0x3F, 0x40, 0x40, 0x40, 0x3F]
V = [0x1F, 0x20, 0x40, 0x20, 0x1F]
W = [0x3F, 0x40, 0x38, 0x40, 0x3F]
X = [0x63, 0x14, 0x08, 0x14, 0x63]
Y = [0x07, 0x08, 0x70, 0x08, 0x07]
Z = [0x61, 0x51, 0x49, 0x45, 0x43]

SPACE = [0, 0, 0, 0, 0]
DASH  = [0x08, 0x08, 0x08, 0x08, 0x08]

_DIGS = [DIG0, DIG1, DIG2, DIG3, DIG4, DIG5, DIG6, DIG7, DIG8, DIG9]
_ALPHA = {
  'A': A,'B': B,'C': C,'D': D,'E': E,'F': F,'G': G,'H': H,'I': I,'J': J,
  'K': K,'L': L,'M': M,'N': N,'O': O,'P': P,'Q': Q,'R': R,'S': S,'T': T,
  'U': U,'V': V,'W': W,'X': X,'Y': Y,'Z': Z,
  '-': DASH,' ': SPACE
}

def glyph(c):
    if not c:
        return SPACE
    if 'a' <= c <= 'z':
        c = chr(ord(c) - 32)
    if '0' <= c <= '9':
        return _DIGS[ord(c) - ord('0')]
    return _ALPHA.get(c, SPACE)

def drawChar5x7(col0, row0, c):
    g = glyph(c)
    for x in range(5):
        bits = g[x]
        for y in range(7):
            if bits & (1 << y):
                col = col0 + x
                row = row0 + y
                if 0 <= row <= 7 and 0 <= col <= 15:
                    dotS(row, col, True)

def dotshow2Char(txt):
    dotClear()
    s = str(txt) if txt is not None else ""
    c1 = s[0] if len(s) > 0 else ' '
    c2 = s[1] if len(s) > 1 else ' '
    drawChar5x7(1, 0, c1)
    drawChar5x7(9, 0, c2)
    dotShow()

def dotshowScrollText(txt, speedMs=80):
    if txt is None:
        return
    s = str(txt)
    buf = []
    for i in range(SCROLL_MAX_CHARS):
        buf.append(s[i] if i < len(s) else ' ')
    textWidth = SCROLL_MAX_CHARS * 6
    for offset in range(16, -textWidth, -1):
        dotClear()
        col = offset
        for i in range(SCROLL_MAX_CHARS):
            drawChar5x7(col, 0, buf[i])
            col += 6
        dotShow()
        time.sleep_ms(int(speedMs))

def dotshowFirework(speedMs=60):
    launchCol = (urandom.getrandbits(8) % 10) + 3
    for r in range(7, 0, -1):
        dotClear()
        dotS(r, launchCol, True)
        dotShow()
        time.sleep_ms(int(speedMs))
    cr = 1
    cc = launchCol
    dotClear()
    dotS(cr, cc, True)
    if cr - 1 >= 0: dotS(cr - 1, cc, True)
    if cr + 1 <= 7: dotS(cr + 1, cc, True)
    if cc - 1 >= 0: dotS(cr, cc - 1, True)
    if cc + 1 <= 15: dotS(cr, cc + 1, True)
    dotShow()
    time.sleep_ms(120)
    dotClear()
    for dr in range(-2, 3):
        for dc in range(-2, 3):
            if ((abs(dr) == 2 and abs(dc) == 0) or
                (abs(dc) == 2 and abs(dr) == 0) or
                (abs(dr) == 1 and abs(dc) == 1)):
                rr = cr + dr
                cc2 = cc + dc
                if 0 <= rr <= 7 and 0 <= cc2 <= 15:
                    dotS(rr, cc2, True)
    dotShow()
    time.sleep_ms(150)
    dotClear()
    for _ in range(12):
        rr = urandom.getrandbits(8) % 8
        cc3 = urandom.getrandbits(8) % 16
        dotS(rr, cc3, True)
    dotShow()
    time.sleep_ms(150)
    dotClear()
    dotShow()

def dotshowRainFall(frames=80, speedMs=60):
    global _dropRow
    try:
        _dropRow
    except:
        _dropRow = [-1] * 16
    for _ in range(int(frames)):
        dotClear()
        for c in range(16):
            if _dropRow[c] >= 0:
                _dropRow[c] += 1
            if _dropRow[c] > 7:
                _dropRow[c] = -1
            if _dropRow[c] < 0:
                if (urandom.getrandbits(8) % 100) < 18:
                    _dropRow[c] = 0
            if 0 <= _dropRow[c] <= 7:
                dotS(_dropRow[c], c, True)
        dotShow()
        time.sleep_ms(int(speedMs))

try:
    dotmatrixSetup()
except:
    pass

# ===== Public API for blocks =====
def display_clear():
    dotClear()
    dotShow()

def display_dot(x, y, on=True):
    dotS(int(y), int(x), bool(on))
    dotShow()

# ✅ NEW public API: immediate refresh like Arduino dotShowAt
def display_dot_at(row, col, on=True):
    dotShowAt(int(row), int(col), bool(on))

def display_show_2chars(v):
    dotshow2Char(v)

def display_scroll(v):
    dotshowScrollText(v, 80)

def display_firework(speedMs=60):
    dotshowFirework(speedMs)

def display_rainfall(frames=80, speedMs=60):
    dotshowRainFall(frames, speedMs)

# ===== Ported from KidBright32 display module =====
# Small 3x7 digit font (column bytes, bit0 = top row)
_NUM3 = [
    [0x7F, 0x41, 0x7F],  # 0
    [0x42, 0x7F, 0x40],  # 1
    [0x79, 0x49, 0x4F],  # 2
    [0x49, 0x49, 0x7F],  # 3
    [0x0F, 0x08, 0x7F],  # 4
    [0x4F, 0x49, 0x79],  # 5
    [0x7F, 0x49, 0x79],  # 6
    [0x01, 0x01, 0x7F],  # 7
    [0x7F, 0x49, 0x7F],  # 8
    [0x4F, 0x49, 0x7F],  # 9
]
_MINUS3 = [0x08, 0x08, 0x08]

def _clearCols(c0, c1):
    for c in range(c0, c1):
        for r in range(8):
            dotS(r, c, False)

def _drawSmall(col0, ch):
    if ch == '-':
        g = _MINUS3
    elif '0' <= ch <= '9':
        g = _NUM3[ord(ch) - 48]
    else:
        return
    for x in range(3):
        for y in range(7):
            if g[x] & (1 << y):
                c = col0 + x
                if 0 <= c <= 15:
                    dotS(y, c, True)

def _numText(n, width):
    try:
        n = int(n)
    except:
        n = 0
    lo = -(10 ** (width - 1) - 1)
    hi = 10 ** width - 1
    if n < lo: n = lo
    if n > hi: n = hi
    s = str(n)
    return ' ' * (width - len(s)) + s

# number up to 4 digits (-999..9999), 4 columns per digit
def display_show4x8(n):
    dotClear()
    s = _numText(n, 4)
    for i in range(4):
        _drawSmall(i * 4, s[i])
    dotShow()

# number -9..99 on the left half only (right half untouched)
def display_left(n):
    _clearCols(0, 8)
    s = _numText(n, 2)
    _drawSmall(0, s[0])
    _drawSmall(4, s[1])
    dotShow()

# number -9..99 on the right half only (left half untouched)
def display_right(n):
    _clearCols(8, 16)
    s = _numText(n, 2)
    _drawSmall(8, s[0])
    _drawSmall(12, s[1])
    dotShow()

# scrolling bar graph, value 0..100 -> 0..8 dots high
_plotBuf = [0] * 16
def display_plot(v):
    try:
        v = float(v)
    except:
        v = 0
    if v < 0: v = 0
    if v > 100: v = 100
    _plotBuf.pop(0)
    _plotBuf.append(int(v * 8 / 100 + 0.5))
    dotClear()
    for c in range(16):
        for k in range(_plotBuf[c]):
            dotS(7 - k, c, True)
    dotShow()

# 16 column bytes from the picture editor (bit7 = top row)
def display_raw(data):
    dotClear()
    for x in range(min(16, len(data))):
        b = data[x]
        for y in range(8):
            if b & (0x80 >> y):
                dotS(y, x, True)
    dotShow()

def display_custom_pattern(pattern):
    dotClear()
    try:
        if isinstance(pattern, str):
            s = ''.join([c for c in pattern if c in '01'])
            if len(s) >= 128:
                for ry in range(8):
                    rowbits = s[ry*16:(ry+1)*16]
                    for cx in range(16):
                        if rowbits[cx] == '1':
                            dotS(ry, cx, True)
    except:
        pass
    dotShow()
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_dotmatrix_driver', 'mbx_matrix', ['import_machine_i2c']);
}

// =====================================================
// Generators (match your block types exactly)
// =====================================================

// Picture editor value looks like "\x00\x38..." (16 column bytes)
Blockly.Python['display_custom'] = function(block) {
  ensureMBXDotMatrixAPI();
  const pattern = block.getFieldValue('value') || '';
  if (/^(\\x[0-9a-fA-F]{2})+$/.test(pattern)) {
    return `display_raw(b"${pattern}")\n`;
  }
  return `display_custom_pattern(${JSON.stringify(pattern)})\n`;
};

Blockly.Python['display_show4x8'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_show4x8(${v})\n`;
};

Blockly.Python['display_left_show'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_left(${v})\n`;
};

Blockly.Python['display_right_show'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_right(${v})\n`;
};

Blockly.Python['display_plot'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_plot(${v})\n`;
};

Blockly.Python['display_dot_show'] = function(block) {
  ensureMBXDotMatrixAPI();
  const x = Blockly.Python.valueToCode(block, 'x', Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, 'y', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_dot(${x}, ${y}, True)\n`;
};

Blockly.Python['display_dot_hide'] = function(block) {
  ensureMBXDotMatrixAPI();
  const x = Blockly.Python.valueToCode(block, 'x', Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, 'y', Blockly.Python.ORDER_ATOMIC) || "0";
  return `display_dot(${x}, ${y}, False)\n`;
};

Blockly.Python['display_show'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "''";
  return `display_show_2chars(${v})\n`;
};

Blockly.Python['display_scroll'] = function(block) {
  ensureMBXDotMatrixAPI();
  const v = Blockly.Python.valueToCode(block, 'value', Blockly.Python.ORDER_ATOMIC) || "''";
  return `display_scroll(${v})\n`;
};

Blockly.Python['display_firework'] = function(block) {
  ensureMBXDotMatrixAPI();
  const speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || "60";
  return `display_firework(${speed})\n`;
};

Blockly.Python['display_rainfall'] = function(block) {
  ensureMBXDotMatrixAPI();
  const frames = Blockly.Python.valueToCode(block, 'frames', Blockly.Python.ORDER_ATOMIC) || "80";
  const speed  = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC) || "60";
  return `display_rainfall(${frames}, ${speed})\n`;
};



// Arrow icons (8x8, drawn in the middle of the 16x8 matrix)
Blockly.Python['display_arrow'] = function(block) {
  ensureMBXDotMatrixAPI();
  Blockly.Python.definitions_['mbx_dotmatrix_arrows'] =
`_ARROWS = {
  'F': ["...##...",
        "..####..",
        ".######.",
        "########",
        "...##...",
        "...##...",
        "...##...",
        "...##..."],
  'B': ["...##...",
        "...##...",
        "...##...",
        "...##...",
        "########",
        ".######.",
        "..####..",
        "...##..."],
  'L': ["...#....",
        "..##....",
        ".#######",
        "########",
        "########",
        ".#######",
        "..##....",
        "...#...."],
  'R': ["....#...",
        "....##..",
        "#######.",
        "########",
        "########",
        "#######.",
        "....##..",
        "....#..."],
}

def display_arrow(d):
    dotClear()
    rows = _ARROWS.get(d)
    if rows:
        for r in range(8):
            for c in range(8):
                if rows[r][c] == '#':
                    dotS(r, c + 4, True)
    dotShow()
`;
  const dir = block.getFieldValue('dir') || 'F';
  return `display_arrow('${dir}')\n`;
};

Blockly.Python['display_clear'] = function(block) {
  ensureMBXDotMatrixAPI();
  return `display_clear()\n`;
};

// ✅ NEW: display_dot_at block generator
// NOTE: dotS(row,col) but UI uses x=col y=row, so call display_dot_at(y, x, on)
Blockly.Python['display_dot_at'] = function(block) {
  ensureMBXDotMatrixAPI();
  const x = Blockly.Python.valueToCode(block, 'x', Blockly.Python.ORDER_ATOMIC) || "0";
  const y = Blockly.Python.valueToCode(block, 'y', Blockly.Python.ORDER_ATOMIC) || "0";
  const onVal = (block.getFieldValue('on') === '1') ? 'True' : 'False';
  return `display_dot_at(${y}, ${x}, ${onVal})\n`;
};

