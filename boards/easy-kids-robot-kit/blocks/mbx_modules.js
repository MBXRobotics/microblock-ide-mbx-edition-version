// =====================================================
// MBX: keep main.py small (saves RAM on the ESP32)
//
// Each big driver is uploaded as its own file (mbx_tft.py,
// mbx_matrix.py, ...) and main.py only imports it. MicroPython
// then prepares one small file at a time instead of one huge
// main.py, so it needs much less memory when the program starts.
//
// Files are added to "extra_files", which the IDE clears before
// every upload and sends together with main.py (js/serial.js).
// Load this file FIRST in the board's blocks list.
// =====================================================
(function () {
  // add/replace a file in the upload list
  window.mbxAddUploadFile = function (fileName, content) {
    if (typeof extra_files === "undefined" || !Array.isArray(extra_files)) return;
    const old = extra_files.find(f => f.file === fileName);
    if (old) old.content = content;
    else extra_files.push({ file: fileName, content: content });
  };

  // Move Blockly.Python.definitions_[defKey] into <modName>.py.
  //   importKeys: definitions_ keys with the imports this driver needs
  //   extraNames: names starting with "_" that main.py must use
  //               ("from x import *" skips names starting with "_")
  window.mbxToModule = function (defKey, modName, importKeys, extraNames) {
    const D = Blockly.Python.definitions_;
    const body = D[defKey];
    const importLine = `from ${modName} import *` +
      ((extraNames && extraNames.length) ? `\nfrom ${modName} import ${extraNames.join(", ")}` : "");
    if (!body || body === importLine) return;

    const header = (importKeys || []).map(k => D[k]).filter(Boolean).join("\n");
    window.mbxAddUploadFile(`${modName}.py`, `${header}\n${body}\n`);
    D[defKey] = importLine;
  };

  // Small text hash, used to name picture files
  window.mbxHash = function (s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  };
})();
