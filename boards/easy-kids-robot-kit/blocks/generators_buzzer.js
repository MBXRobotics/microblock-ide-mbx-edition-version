
const BUZZER_PIN = 16;

function ensureBuzzerAPI() {
  // Required imports
  // own key: must not replace "import machine" used by Blynk / sleep / reset blocks
  Blockly.Python.definitions_['import_machine_pin_pwm'] = 'from machine import Pin, PWM';
  Blockly.Python.definitions_['import_time'] = 'import time';

  // Define a "buzzer" object with the same API as board.buzzer
  Blockly.Python.definitions_['mbx_buzzer_api_gpio16'] =
`# --- buzzer API (GPIO${BUZZER_PIN}) ---
_buzzer_pwm = PWM(Pin(${BUZZER_PIN}), freq=1000, duty=0)

class _Buzzer:
    def __init__(self, pwm):
        self._pwm = pwm
        self._volume = 100  # 0..100 (you can change default to 50 if needed)

    @property
    def volume(self):
        return self._volume

    @volume.setter
    def volume(self, v):
        try:
            v = int(v)
        except:
            v = 100
        if v < 0: v = 0
        if v > 100: v = 100
        self._volume = v

    def _duty(self):
        # ESP32 MicroPython PWM duty is typically 0..1023
        # Limiting max duty makes sound cleaner (less distortion)
        max_duty = 350   # ✅ try 250..450 if you want tune
        d = int(self._volume * max_duty / 100)
        if d < 0: d = 0
        if d > max_duty: d = max_duty
        return d

    def tone(self, freq, seconds):
        try:
            f = int(freq)
        except:
            f = 1000
        if f < 1:
            f = 1
        try:
            s = float(seconds)
        except:
            s = 0.1

        self._pwm.freq(f)
        self._pwm.duty(self._duty())
        time.sleep(s)
        self._pwm.duty(0)

    def note(self, notes, duration):
        # notes examples:
        #   "C5"
        #   "C6 B5 A5 G5 F5 E5 D5 C5"
        # duration from dropdown: 4, 2, 1, 1/2, 1/4
        tempo = 0.5  # seconds per "1" duration unit
        try:
            dur = float(duration) * tempo
        except:
            dur = tempo

        if not isinstance(notes, str):
            try:
                notes = str(notes)
            except:
                return

        parts = [p for p in notes.replace(',', ' ').split() if p]
        if len(parts) == 0:
            return

        # Base note frequencies at octave 0
        NOTE_FREQ = {
          "C": 16.35, "C#": 17.32, "DB": 17.32,
          "D": 18.35, "D#": 19.45, "EB": 19.45,
          "E": 20.60,
          "F": 21.83, "F#": 23.12, "GB": 23.12,
          "G": 24.50, "G#": 25.96, "AB": 25.96,
          "A": 27.50, "A#": 29.14, "BB": 29.14,
          "B": 30.87
        }

        def note_to_freq(n):
            n = n.strip().upper()
            if n in ["SIL", "REST", "R", "-", "PAUSE"]:
                return None
            if len(n) < 2:
                return None
            pitch = n[0]
            idx = 1
            if idx < len(n) and n[idx] in ['#', 'B']:
                pitch += n[idx]
                idx += 1
            try:
                octave = int(n[idx:])
            except:
                return None
            base = NOTE_FREQ.get(pitch)
            if base is None:
                return None
            return base * (2 ** octave)

        # Small gap between notes -> cleaner sound
        gap = 0.02  # 20ms
        for p in parts:
            f = note_to_freq(p)
            if f is None:
                self._pwm.duty(0)
                time.sleep(dur)
            else:
                # play slightly shorter then rest gap
                play_dur = dur - gap if dur > gap else dur
                self.tone(int(f), play_dur)
                self._pwm.duty(0)
                time.sleep(gap)

# Expose "buzzer" like firmware does
buzzer = _Buzzer(_buzzer_pwm)
`;
  // upload this driver as its own file (keeps main.py small)
  if (typeof mbxToModule === "function") mbxToModule('mbx_buzzer_api_gpio16', 'mbx_buzzer', ['import_machine_pin_pwm', 'import_time']);
}

// ---- Blocks (same API as original) ----

Blockly.Python['buzzer_tone'] = function(block) {
  ensureBuzzerAPI();

  const value_freq =
    Blockly.Python.valueToCode(block, 'freq', Blockly.Python.ORDER_ATOMIC) || '1000';

  const value_duration =
    Blockly.Python.valueToCode(block, 'duration', Blockly.Python.ORDER_ATOMIC) || '1';

  return `buzzer.tone(${value_freq}, ${value_duration})\n`;
};

Blockly.Python['buzzer_notes'] = function(block) {
  ensureBuzzerAPI();

  const value_notes =
    Blockly.Python.valueToCode(block, 'notes', Blockly.Python.ORDER_ATOMIC) || '""';

  const dropdown_duration = block.getFieldValue('duration') || '1';

  return `buzzer.note(${value_notes}, (${dropdown_duration}))\n`;
};

Blockly.Python['buzzer_volume'] = function(block) {
  ensureBuzzerAPI();

  const value_level =
    Blockly.Python.valueToCode(block, 'level', Blockly.Python.ORDER_ATOMIC) || '100';

  return `buzzer.volume = ${value_level}\n`;
};

Blockly.Python['make_note'] = function(block) {
  const text_notes = block.getFieldValue('notes') || '';
  const safe = text_notes.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return [`'${safe}'`, Blockly.Python.ORDER_NONE];
};
