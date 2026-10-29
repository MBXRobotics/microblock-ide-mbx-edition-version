let extensionList = [];
let projectFilePath = null;
let saveAsFlag = false;

var blocklyWorkspace;

let updateBlockCategory = async () => {
    if (isEmbed) return;

    // ---------- helpers ----------
    const slugify = (s) =>
        String(s || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]/g, "")
            .replace(/\-+/g, "-");

    const hexToRgb = (hex) => {
        if (!hex) return null;
        let h = String(hex).trim();
        if (h.startsWith("#")) h = h.slice(1);
        if (h.length === 3) h = h.split("").map(ch => ch + ch).join("");
        if (h.length !== 6) return null;
        const n = parseInt(h, 16);
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: n & 255
        };
    };

    // amount: 0..1 (0 = original, 1 = white)
    const lightenHex = (hex, amount = 0.80) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return "";
        const r = Math.round(rgb.r + (255 - rgb.r) * amount);
        const g = Math.round(rgb.g + (255 - rgb.g) * amount);
        const b = Math.round(rgb.b + (255 - rgb.b) * amount);
        return `rgb(${r}, ${g}, ${b})`;
    };

    // Inject base style once (rounded rows + spacing)
    if (!document.getElementById("mbx-toolbox-category-style")) {
        const style = document.createElement("style");
        style.id = "mbx-toolbox-category-style";
        style.textContent = `
 /* === CATEGORY CARD === */
 .blocklyToolboxDiv .blocklyTreeRow {
    border-radius: 0 !important;
    margin: 8px 10px !important;
    padding: 0 !important;

    height: 120px;                 /* 🔥 บังคับความสูงตายตัว */
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;

    text-align: center;
    box-sizing: border-box;
}

/* === ICON CONTAINER === */
.blocklyToolboxDiv .blocklyTreeIcon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    width: 100%;
    height: 52px;                  /* 🔥 คุมพื้นที่ icon */
    margin: 0 !important;
    padding: 0 !important;
}

/* === ICON IMAGE === */
.blocklyToolboxDiv .blocklyTreeIcon img {
    width: 46px;
    height: 46px;
    object-fit: contain;
    display: block;
}

/* === LABEL TEXT === */
.blocklyToolboxDiv .blocklyTreeLabel {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    width: 100%;
    height: 32px;                  /* 🔥 คุมพื้นที่ text */
    margin: 3px 0 0 0 !important;
    padding: 0 !important;

    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    text-align: center;
}


        `;
        document.head.appendChild(style);
    }

    // ---------- Build Toolbox XML + Meta for styling ----------
    let categoryIconList = [];
    let categoryMetaList = []; // { name, slug, color, bg }

    let toolboxTextXML = `<xml xmlns="https://developers.google.com/blockly/xml">`;

    const board = boards.find(board => board?.id === boardId);
    const level = board?.level?.find(level => level.name === levelName);
    const toolboxTree = level?.blocks || blocksTree;

    // blockTree
    for (let category of toolboxTree) {
        toolboxTextXML += `<category name="${category.name}" colour="${category.color}"${typeof category.blocks === "string" ? ` custom="${category.blocks}"` : ''}>`;

        if (typeof category.blocks === "object") {
            for (let block of category.blocks) {
                if (typeof block === "object") {
                    toolboxTextXML += block.xml;
                } else {
                    if (typeof Blockly.Blocks[block] !== "undefined") {
                        if (typeof Blockly.Blocks[block].xml !== "undefined") {
                            toolboxTextXML += Blockly.Blocks[block].xml;
                        } else {
                            toolboxTextXML += `<block type="${block}"></block>`;
                        }
                    } else {
                        console.warn(block, "undefined, forget add blocks_xxx.js ?");
                    }
                }
            }
        } else if (typeof category.blocks === "function") {
            let xmlList = category.blocks(blocklyWorkspace);
            for (let xml of xmlList) {
                toolboxTextXML += Blockly.Xml.domToText(xml);
            }
        }

        toolboxTextXML += `</category>`;

        // icon
        categoryIconList.push(
            category.icon.startsWith("/")
                ? rootPath + category.icon
                : `${rootPath}/boards/${boardId}/${category.icon}`
        );

        // meta (for background fill)
        categoryMetaList.push({
            name: category.name,
            slug: slugify(category.name),
            color: category.color || "#cccccc",
            bg: lightenHex(category.color || "#cccccc", 0.78) // adjust strength here
        });
    }

    // Extenstion
    extenstionTree = [];
    for (const extensionId of fs.ls("/extension")) {
        let extension = fs.read(`/extension/${extensionId}/extension.js`);
        extension = eval(extension);

        if (board?.isArduinoPlatform && (!extension?.supportArduinoPlatform)) {
            continue;
        }

        extenstionTree.push(extension);
        categoryIconList.push(fs.read(`/extension/${extensionId}/${extension.icon}`));

        categoryMetaList.push({
            name: extension.name,
            slug: slugify(extension.name),
            color: extension.color || "#cccccc",
            bg: lightenHex(extension.color || "#cccccc", 0.78)
        });
    }

    if (isElectron) {
        let extensionDir = sharedObj.extensionDir;
        for (const extensionId of nodeFS.ls(extensionDir)) {
            let extension = await readFileAsync(`${extensionDir}/${extensionId}/extension.js`);
            extension = extension.toString();
            extension = eval(extension);

            extenstionTree.push(extension);
            categoryIconList.push(`${extensionDir}/${extensionId}/${extension.icon}`);

            categoryMetaList.push({
                name: extension.name,
                slug: slugify(extension.name),
                color: extension.color || "#cccccc",
                bg: lightenHex(extension.color || "#cccccc", 0.78)
            });
        }
    }

    for (let category of extenstionTree) {
        toolboxTextXML += `<category name="${category.name}" colour="${category.color}"${typeof category.blocks === "string" ? ` custom="${category.blocks}"` : ''}>`;

        if (typeof category.blocks === "object") {
            for (let block of category.blocks) {
                if (typeof block === "object") {
                    toolboxTextXML += block.xml;
                } else {
                    if (typeof Blockly.Blocks[block] !== "undefined") {
                        if (typeof Blockly.Blocks[block].xml !== "undefined") {
                            toolboxTextXML += Blockly.Blocks[block].xml;
                        } else {
                            toolboxTextXML += `<block type="${block}"></block>`;
                        }
                    } else {
                        console.warn(block, "undefined, forget add blocks_xxx.js ?");
                    }
                }
            }
        } else if (typeof category.blocks === "function") {
            let xmlList = category.blocks(blocklyWorkspace);
            for (let xml of xmlList) {
                toolboxTextXML += Blockly.Xml.domToText(xml);
            }
        }

        toolboxTextXML += `</category>`;
    }

    toolboxTextXML += `</xml>`;

    let toolboxXML = Blockly.utils.xml.textToDom(toolboxTextXML);

    // Update toolbox
    blocklyWorkspace.updateToolbox(toolboxXML);

    // ---------- Apply icons + background fill ----------
    // 1) add icons (clear old to avoid duplicates)
    const iconSpans = $("span.blocklyTreeIcon");
    for (const [index, element] of Object.entries(iconSpans)) {
        if (typeof element === "object" && element.nodeType !== undefined) {
            const url = categoryIconList[index];
            if (!url) continue;
            $(element).find("img").remove();
            $(element).append(`<img src="${url}" alt="">`);
        }
    }

    // 2) fill background color for each category row
    // rows match order of categories shown in toolbox
    const rows = $(".blocklyToolboxDiv .blocklyTreeRow");
    rows.each((i, row) => {
        const meta = categoryMetaList[i];
        if (!meta) return;

        // add class and data for future custom CSS
        row.classList.add(`cat-${meta.slug}`);
        row.setAttribute("data-cat", meta.slug);

        // Fill background
        row.style.backgroundColor = meta.bg;

        // Optional: make label darker for readability
        const label = row.querySelector(".blocklyTreeLabel");
        if (label) label.style.color = "#1f2d3d";
    });
};


Blockly.triggleResize = function (e) {
    // Compute the absolute coordinates and dimensions of blocklyArea.
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    Blockly.svgResize(blocklyWorkspace);
};

let embedOption = {
    id: "",
    width: 0,
    height: 0,
    blockOnly: 0,
    fit: 0
};

if (isEmbed) {
    $(".page").addClass("embed");
    $(".page > .main > footer").hide();
    $(".top-bar-button").hide();
    $(".blocklyToolboxDiv").hide();
    $(".embed-only").show();

    $("#embed-edit").click(() => {
        window.open(`https://ide.microblock.app/?open=${pageParams.get("open") || ""}`, "_blank");
    });

    let allParams = {};
    for (let p of pageParams) {
        allParams[p[0]] = ((v) => {
            if (v.indexOf("%") > 0) return v;
            return parseInt(v) || 0;
        })(p[1]);
    }
    embedOption = Object.assign(embedOption, allParams);

    if (embedOption.blockOnly == 1) {
        $(".page > .main > header").hide();
        // blocklyWorkspace.scrollbar.dispose();
        // blocklyWorkspace.zoomControls_.dispose();
        // blocklyWorkspace.zoomControls_.svgGroup_.remove();
    }

    // Blockly.triggleResize();
}

var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');

blocklyWorkspace = Blockly.inject(blocklyDiv, {
    media: 'blockly/media/',
    toolbox: document.getElementById('toolbox'),
    grid: {
        spacing: 25,
        length: 1,
        colour: '#888',
        snap: true
    },
    trashcan: true,
    zoom: {
        controls: true,
        wheel: (isEmbed && embedOption.blockOnly) ? false : true,
        startScale: 1,
        maxScale: Infinity,
        minScale: 0.3,
        scaleSpeed: 1.2
    },
    scrollbars: (isEmbed && embedOption.blockOnly) ? false : true,
    comments: true,
    disable: true,
    maxBlocks: Infinity,
    rtl: false,
    oneBasedIndex: false,
    sounds: true,
    readOnly: isEmbed,

    /* Option */
    renderer: localStorage.getItem("renderer") || "zelos",
});

window.addEventListener('resize', Blockly.triggleResize, false);
Blockly.triggleResize();

/** Override Blockly.alert() with custom implementation. */
Blockly.dialog.setAlert((message, callback) => {
    Notiflix.Report.Info("Alert", message, "OK", callback);
});

/** Override Blockly.confirm() with custom implementation. */
Blockly.dialog.setConfirm((message, callback) => {
    Notiflix.Confirm.Show('Are you Confirm ?', message, 'Yes', 'No', function () {
        callback(true);
    },
        function () {
            callback(false);
        });
});

Notiflix.Confirm.Init({
    plainText: false
});

/** Override Blockly.prompt() with custom implementation. */
Blockly.dialog.setPrompt((message, defaultValue, callback) => {
    Notiflix.Confirm.Show("Prompt", `${message}<br><br><input type="text" id="prompt-input" value="${defaultValue}">`, 'OK', 'Cancle', function () {
        callback($("#prompt-input").val());
    },
        function () {
            callback(null);
        });
});

const selectRenderer = renderer => {
    localStorage.setItem("renderer", renderer);
    window.location.reload();
};

if (isElectron) {
    nodeFS.walk = (dir) => {
        return new Promise((resolve, reject) => {
            let files = [];
            dive(dir, (err, file) => {
                files.push(file);
            }, () => {
                resolve(files);
            });
        });
    };

    nodeFS.ls = (dir) => nodeFS.readdirSync(dir).filter(f => nodeFS.statSync(path.join(dir, f)).isDirectory());
}

file_name_select = "main.xml";

const updateWorkspace = () => {
    if (file_name_select.endsWith(".xml")) { // Update block
        const code = fs.read(`/${file_name_select}`);
        blocklyWorkspace.clear();
        $("#mode-select-switch > li[data-value='1']").click();
        if (code) {
            try {
                Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(code), blocklyWorkspace);
            } catch (e) {
                console.log(e);
            }
            blocklyWorkspace.scrollCenter();
        }
    }

    if (file_name_select.endsWith(".py")) {  // Update code
        const code = fs.read(`/${file_name_select}`);
        $("#mode-select-switch > li[data-value='2']").click();
        $(async () => {
            while (!editor) {
                await sleep(100);
            }
            editor.updateOptions({ readOnly: false });
        });
        editor.setValue(code || "");
    }
}

/* Auto Save to localStorage */
const updataWorkspaceAndCategoryFromvFS = async (disable_load_fs) => {
    if (!vFSTree) {
        vFSTree = {};
    }

    for (const extensionId of fs.ls("/extension")) {
        let extensionLocalPath = `/extension/${extensionId}`;
        let blocksFile = fs.walk(`${extensionLocalPath}/blocks`);
        for (const file of blocksFile) {
            if (file.endsWith(".js")) {
                let jsContent = fs.read(`${extensionLocalPath}/blocks/${file}`);
                try {
                    eval(jsContent);
                } catch (e) {
                    NotifyE("Script run error: " + e.toString());
                    console.error(e);
                }
            } else {
                console.warn("Why file " + file + " in blocks ? support .js only so skip it");
            }
        }
    }

    if (isElectron) {
        // Load local extension
        let extensionDir = sharedObj.extensionDir;
        for (const extensionId of nodeFS.ls(extensionDir)) {
            let extensionLocalPath = `${extensionDir}/${extensionId}`;
            let blocksFile = await nodeFS.walk(`${extensionLocalPath}/blocks`);
            for (const file of blocksFile) {
                if (file.endsWith(".js")) {
                    let jsContent = await readFileAsync(file);
                    jsContent = jsContent.toString();
                    try {
                        eval(jsContent);
                    } catch (e) {
                        NotifyE("Script run error: " + e.toString());
                        console.error(e);
                    }
                } else {
                    console.warn("Why file " + file + " in blocks ? support .js only so skip it");
                }
            }
        }
    }

    updateBlockCategory();

    if (disable_load_fs) {
        return;
    }

    updateWorkspace();
}

let hotUpdate = async () => {
    if (!vFSTree) {
        vFSTree = {};
    }
    let configFileContent = fs.read("/config.json");
    if (configFileContent) {
        let projectConfig = JSON.parse(configFileContent);
        if (projectConfig) {
            // useMode = projectConfig?.mode || "block";
            boardId = projectConfig?.board || null;
            levelName = projectConfig?.level || null;
        }
    }

    const file_list = fs.ls("/");
    if (file_list.indexOf("main.py") >= 0) {
        useMode = "code";
        file_name_select = "main.py";
    } else if (file_list.indexOf("main.xml") >= 0) {
        useMode = "block";
        file_name_select = "main.xml";
    } else {
        useMode = "block";
    }

    if ((!boardId) || (!levelName)) {
        boardId = boards[0].id;
        levelName = boards[0].level[0].name;
    }

    await loadBoard();
    if (useMode === "block") {
        updataWorkspaceAndCategoryFromvFS();
    } else if (useMode === "code") {
        $("#mode-select-switch > li[data-value='2']").click();
        $(async () => {
            while (!editor) {
                await sleep(100);
            }
            updateWorkspace();
            editor.updateOptions({ readOnly: false });
        });
    }
}


let loadCodeAlready = false;
let callHotUpdate = true;

if (isElectron) {
    for (let arg of sharedObj.argv) {
        if (arg.endsWith(".mby")) {
            let filePath = arg;
            console.log(filePath);
            if (nodeFS.existsSync(filePath)) {
                vFSTree = JSON.parse(nodeFS.readFileSync(filePath));
                loadCodeAlready = true;
                sharedObj.argv = [];
            }
            break;
        }
    }
}

{
    let openArg = pageParams.get("open");
    if (openArg) {
        (async (fileName) => {
            Notiflix.Block.Standard("body", 'Loading...');

            let fileContent = await fetch(`https://us-central1-ublock-c0a08.cloudfunctions.net/share/files/${fileName}`, {
                method: "get",
                redirect: "follow"
            });

            fileContent = await fileContent.text();

            await openProjectFromData(fileContent, fileName);

            Notiflix.Block.Remove("body");

            if (isEmbed) {
                if (embedOption.blockOnly == 1) {
                    blocklyWorkspace.zoomControls_.svgGroup_.remove();
                }
                let { width, height } = blocklyWorkspace.getCanvas().getBBox();
                let updateFrameSize = window.parent.microBlock.updateFrameSize;
                if (updateFrameSize) {
                    let fSizeW = embedOption.width;
                    let fSizeH = embedOption.height;
                    if (fSizeW === 0) fSizeW = `${width + 20 + (embedOption.blockOnly != 1 ? 20 : 0)}px`;
                    if (fSizeH === 0) fSizeH = `${height + 20 + (embedOption.blockOnly != 1 ? 60 : 0)}px`;
                    updateFrameSize(embedOption.id, fSizeW, fSizeH);
                    setTimeout(() => {
                        blocklyWorkspace.scrollCenter();
                        if (embedOption.fit == 1) {
                            blocklyWorkspace.zoomToFit();
                        }
                    }, 10);
                }
            }
        })(openArg);
        callHotUpdate = false;
    }
}

if (!loadCodeAlready) {
    vFSTree = JSON.parse(localStorage.getItem("autoSaveFS"));
}

if (callHotUpdate) {
    hotUpdate();
}

let saveCodeToLocal = () => {
    const file_write_path = `/${file_name_select}`;
    if (file_write_path.endsWith(".xml")) {
        // fs.remove("/main.py");
        try {
            var xmlText = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(blocklyWorkspace));
            fs.write(file_write_path, xmlText);
        } catch (e) {
            console.log(e);
        }
    } else if (file_write_path.endsWith(".py")) {
        // fs.remove("/main.xml");
        fs.write(file_write_path, editor.getValue());
    }
    fs.write("/config.json", JSON.stringify({
        mode: useMode,
        github: github_project_repo,
        board: boardId,
        level: levelName
    }));
    localStorage.setItem("autoSaveFS", JSON.stringify(vFSTree));
};

blocklyWorkspace.addChangeListener(saveCodeToLocal);
/* -------------- */

/*
$("#new-project").click(async () => {
    if (await NotifyConfirm("All blocks will lost. Are you sure of new project ?")) {
        blocklyWorkspace.clear();
        if (editor) editor.setValue("");
        vFSTree = "";
        vFSTree = { };

        updateBlockCategory();
    }
});
*/

$("#save-project").click(async () => {
    if (!github_project_repo) { // Save to local
        if (!isElectron) {
            let data = JSON.stringify(vFSTree);
            let blob = new Blob([data], { type: "application/json" });
            let url = window.URL.createObjectURL(blob);

            let link = document.createElement("a");
            link.download = $("#project-name").val() + ".mby";
            link.href = url;
            link.click();

            window.URL.revokeObjectURL(url);

            statusLog("Save project");
        } else {
            let OpenFilePath = "";
            if ((!projectFilePath) || saveAsFlag) {
                let result = await dialog.showSaveDialog({
                    filters: [{
                        name: 'microBlock IDE',
                        extensions: ['mby']
                    }],
                    defaultPath: $("#project-name").val() + ".mby"
                });

                if (result.canceled) {
                    return;
                }

                projectFilePath = result.filePath;
                saveAsFlag = false;
            }

            nodeFS.writeFile(projectFilePath, JSON.stringify(vFSTree), err => {
                if (err) {
                    NotifyE("Save project fail: " + err.toString());
                    return;
                }

                NotifyS("Save project at " + projectFilePath);
                statusLog("Save project at " + projectFilePath);
            });
        }
    } else { // Save to GitHub
        saveCodeToGitHub();
    }
});

let openProjectFromData = async (data, path) => {
    vFSTree = JSON.parse(data);
    await hotUpdate();
    if (!isEmbed) NotifyS("Open project " + path)
    statusLog("Open project " + path);
    $("#project-name").val(path.split(/[\\\/]/).pop().replace(".mby", ""));
}

let openProject = async (filePath) => {
    if (!await NotifyConfirm("All blocks will lost. Are you sure of open project ?")) {
        return;
    }

    if (!isElectron) {
        let input = document.createElement("input");
        input.type = "file";
        input.accept = ".mby";
        input.addEventListener("change", function () {
            // console.log(this.files);
            let fileName = this.files[0].name.replace(".mby", "");
            let fr = new FileReader();
            fr.onload = async () => {
                openProjectFromData(fr.result, fileName);
            };
            fr.readAsText(this.files[0]);
        }, false);
        input.click();
    } else {
        let OpenFilePath = null;
        if (!filePath) {
            let result = await dialog.showOpenDialogSync({
                properties: [
                    'openFile'
                ],
                filters: [{
                    name: 'microBlock IDE',
                    extensions: ['mby']
                }]
            });

            if (result == undefined) {
                return;
            }

            OpenFilePath = result[0];
        } else {
            OpenFilePath = filePath;
        }

        nodeFS.readFile(OpenFilePath, async (err, data) => {
            if (err) {
                NotifyE("Open project fail: " + err.toString());
                return;
            }

            projectFilePath = OpenFilePath;
            openProjectFromData(data, OpenFilePath);
        });
    }
};

$("#open-project").click(async () => {
    openProject();
});

$("#open-help").click(() => {
    if (!isElectron) {
        window.open("https://microblock.app/", "_blank");
    } else {
        shell.openExternal("https://microblock.app/");
    }
});

let imageSelectUpdate = (sel) => {
    $(sel).find("li > div").click(function () {
        $(sel).find("li > div").removeClass("active");
        $(this).addClass("active");
    });
};

$(() => {
    for (sel of $(".image-select")) {
        imageSelectUpdate(sel);
    }
});

let statusLog = text => {
    let now = new Date();
    $("#text-status").text(`${text} at ${now.getHours()}:${(now.getMinutes() < 10 ? "0" : "")}${now.getMinutes()}:${(now.getSeconds() < 10 ? "0" : "")}${now.getSeconds()}`);
};

$(document).keydown(function (event) {
    // console.log(event)
    if (event.ctrlKey) {
        let key = event.key;
        if (key === 's') { // Ctrl + S -> Save
            event.preventDefault();
            $("#save-project").click();
        } else if (key === 'n') { // Ctrl + N -> New
            event.preventDefault();
            $("#new-project").click();
        } else if (key === 'o') { // Ctrl + O -> Open
            event.preventDefault();
            $("#open-project").click();
        } else if (key === 'h') { // Ctrl + H -> Help
            event.preventDefault();
            $("#open-help").click();
        } else if (key === 't') { // Ctrl + T -> Terminal
            event.preventDefault();
            $("#open-terminal").click();
        } else if (key === 'u') { // Ctrl + U -> Upload
            event.preventDefault();
            $("#upload-program").click();
        }
    }

    return true;
});

$("body")[0].addEventListener("drop", (e) => {
    e.preventDefault();

    if (e.dataTransfer.items.length > 0) {
        let fPath = e.dataTransfer.items[0].getAsFile().path;

        // console.log(fPath);
        if (fPath.endsWith(".mby")) {
            openProject(fPath);
        }
    }
});

$("body")[0].addEventListener("dragover", (e) => {
    e.preventDefault();
});

// Auto Port connect (only on Electron)
let autoConnectFlag = true;
let timerAutoConnect = null;

let autoConnectCheck = async () => {
    if (autoConnectFlag && boardId && isElectron && !serialPort && deviceMode === MODE_REAL_DEVICE) {
        let board = boards.find(board => board.id === boardId);
        let usbInfo = board.usb[0];
        let portList = await serialAPI.list();
        if (portList) {
            let port = portList.find(info => info.productId === usbInfo.productId && info.vendorId === usbInfo.vendorId);
            if (port) {
                // console.log(port);
                serialConnectElectron(port.path, true);
            }
        }
    }
    if (timerAutoConnect) clearTimeout(timerAutoConnect);
    timerAutoConnect = setTimeout(autoConnectCheck, autoConnectFlag ? 500 : 5000);
};
if (isElectron) {
    autoConnectCheck();

    // Update Check
    checkUpdate = async () => {
        let lastPackageFile = await fetch("https://api.github.com/repos/microBlock-IDE/microBlock-IDE-offline/contents/package.json");
        if (lastPackageFile.status !== 200) {
            console.error("Get package.json fail");
            return;
        }

        lastPackageFile = await lastPackageFile.json();
        lastPackageFile = Base64.decode(lastPackageFile.content);
        lastPackageFile = JSON.parse(lastPackageFile);
        if (typeof lastPackageFile.version !== "undefined") {
            if (lastPackageFile.version !== pjson.version) {
                console.log("microBlock IDE offline have new version", lastPackageFile.version, pjson.version);
                NotifyI("microBlock IDE offline have new version");
            } else {
                console.log("microBlock IDE offline now is last version", lastPackageFile.version, pjson.version);
            }
        } else {
            console.error("package.json error", lastPackageFile);
        }
    }

    checkUpdate();
}

$(() => $("#full-loading").fadeOut());

