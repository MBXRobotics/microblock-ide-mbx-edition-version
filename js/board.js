let boards = [];
let boardId = null;
let levelName = null;

let addBoard = board => boards.push(board);

let boardIdSelect = null;

$("#new-project").click(async () => {
    if (!(await NotifyConfirm("All blocks will lost. Are you sure of new project ?"))) {
        return;
    }

    // ✅ Safer default selection:
    // - Prefer current boardId if valid
    // - Else use kidbright32-v1.3 if it exists
    // - Else use the first loaded board
    const hasBoardId = boardId && boards.some(b => b && b.id === boardId);
    const hasKidbright = boards.some(b => b && b.id === "kidbright32-v1.3");
    boardIdSelect = hasBoardId
        ? boardId
        : (hasKidbright ? "kidbright32-v1.3" : (boards[0] ? boards[0].id : null));

    // ✅ If no boards loaded at all, stop (prevents weird empty UI)
    if (!boardIdSelect) {
        NotifyS("No boards loaded. Please check boards/index.js loading.");
        return;
    }

    const tags_list = ["Recommend"]
        .concat(
            boards
                .map(a => a && a.tags ? a.tags : [])
                .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
                .filter((item, index, arr) => arr.indexOf(item) === index)
                .sort()
        );

    $("#boards-tags-list").html(tags_list.map(tag => `<li>${tag}</li>`).join(""));

    $("#boards-tags-list > li").click(e => {
        $("#boards-tags-list > li").removeClass("active");
        $(e.currentTarget).addClass("active");

        const tag_select = e.currentTarget.textContent;

        let board_id_in_tag_list = [];

        if (tag_select === "Recommend") {
            // ✅ Recommend list: prefer these IDs BUT only keep ones that exist in boards[]
            const prefer = [
                boardId,
                "kidbright32-v1.3",
                "kidbright32i",
                "kidbright32iP",
                "kidbright32iA",
                "kidbright32-v1.6",
                // Also include popular originals if KidBright isn't present
                "arduino-uno",
                "arduino-nano",
                "arduino-mega",
                "esp32-dev-board",
                "raspberry-pi-pico"
            ];

            board_id_in_tag_list = prefer
                .filter(id => !!id)
                .filter((item, index, arr) => arr.indexOf(item) === index)
                .filter(id => boards.some(b => b && b.id === id))
                .slice(0, 5);

            // ✅ Fallback: if nothing matched, show first 5 loaded boards
            if (board_id_in_tag_list.length === 0) {
                board_id_in_tag_list = boards
                    .filter(b => b && b.id)
                    .map(b => b.id)
                    .slice(0, 5);
            }
        } else {
            board_id_in_tag_list = boards
                .filter(board => board && board.tags && board.tags.indexOf(tag_select) >= 0)
                .map(board => board.id);
        }

        $("#hardware-select ul").html(
            board_id_in_tag_list.map(board_id => {
                // ✅ IMPORTANT FIX: avoid crash if board_id doesn't exist
                const board = boards.find(a => a && a.id === board_id);
                if (!board) return "";

                if ((!isElectron) && board.isArduinoPlatform) {
                    return "";
                }

                return `
                    <li>
                        <div data-board-id="${board.id}"${board.id === boardIdSelect ? 'class="active"' : ""}>
                            <div class="image"><img src="${rootPath}/boards/${board.id}/${board.image}" alt=""></div>
                            <div class="name">${board.name}</div>
                        </div>
                    </li>
                `;
            }).join("")
        );

        $("#hardware-select ul > li > div").click(e => {
            $("#hardware-select ul > li > div").removeClass("active");
            $(e.currentTarget).addClass("active");

            boardIdSelect = $(e.currentTarget).attr("data-board-id");
        });
    });

    $("#boards-tags-list > li:first-child").click();

    $("#project-create-dialog").show();
});

$("#project-create-dialog .close-btn").click(() => $("#project-create-dialog").hide())

let arduinoConsoleTerm = {
    scroll: () => {
        $("#arduino-console-dialog pre").scrollTop($("#arduino-console-dialog pre")[0].scrollHeight);
    },
    writeln: text => {
        $("#arduino-console-dialog pre")[0].innerText += text + "\r\n";
        arduinoConsoleTerm.scroll();
    },
    write: text => {
        $("#arduino-console-dialog pre")[0].innerText += text;
        arduinoConsoleTerm.scroll();
    },
    clear: () => {
        $("#arduino-console-dialog pre")[0].innerText = "";
    }
};

let loadBoard = async () => {
    if (!boardId || !levelName) {
        return;
    }

    const board = boards.find(board => board && board.id === boardId);
    if (!board) {
        console.warn("Selected board not found:", boardId);
        return;
    }

    let scripts = [];
    scripts = scripts.concat(board.script || []);
    scripts = scripts.concat(board.blocks || []);

    if (typeof board.simulator !== "undefined") {
        scripts = scripts.concat(board.simulator.script || []);
    }

    for (let fPath of scripts) {
        let script;
        try {
            script = await fetch(`${rootPath}/boards/${board.id}/${fPath}`);
        } catch (e) {
            console.warn(e);
            continue;
        }
        if (script.status === 200) {
            try {
                eval(await script.text());
            } catch (e) {
                console.warn(e);
            }
        } else {
            console.warn(script);
        }
    }

    for (let fPath of (board.css || [])) {
        let link = document.createElement('link');
        link.rel = "stylesheet";
        link.href = `${rootPath}/boards/${board.id}/${fPath}`;
        document.head.appendChild(link);
    }

    updateBlockCategory();

    autoCompletionDictionary = board.autoCompletion;

    $("#board-name").text(board.name);
    $("#level-name").text(levelName);

    if (typeof board.simulator !== "undefined") {
        let last_deivce_mode = +localStorage.getItem("last_deivce_mode");
        switchModeTo(last_deivce_mode);
    } else {
        switchModeTo(MODE_REAL_DEVICE);
    }

    if (typeof board?.onLoad === "function") {
        await board.onLoad(blocklyWorkspace, board);
    }

    if (board?.isArduinoPlatform) {
        if (+localStorage.getItem("show-console-board-initial") !== -1) {
            $("#arduino-console-dialog .title").text("Loading...");
            ShowDialog($("#arduino-console-dialog"));
        }

        arduinoConsoleTerm.clear();

        arduino_board_init().then(() => {
            $("#arduino-console-dialog .title").text("Finish");
            CloseDialog($("#arduino-console-dialog"));
        }).catch(e => {
            console.warn(e);
            $("#arduino-console-dialog .title").text("Load board FAIL");
        });
    }
}

$("#create-project-btn").click(async () => {
    {
        const currentId = boardId || "kidbright32-v1.3";
        const board = boards.find(b => b && b.id === currentId);
        if (typeof board?.onDispose === "function") {
            await board.onDispose(blocklyWorkspace, board);
        }
    }

    let projectName = $("#project-name-input").val();

    // ✅ Always use selected board
    boardId = boardIdSelect;

    const selectedBoard = boards.find(b => b && b.id === boardId);
    if (!selectedBoard) {
        NotifyS("Selected board not found: " + boardId);
        return;
    }

    // ✅ Guard: ensure level exists
    if (!selectedBoard.level || !selectedBoard.level[0] || !selectedBoard.level[0].name) {
        NotifyS("Board has no level definition: " + boardId);
        return;
    }

    levelName = selectedBoard.level[0].name;

    await loadBoard();

    // Delete old file
    fs.ls("/").filter(a => a.endsWith(".py") || a.endsWith(".xml")).map(a => fs.remove("/" + a));

    blocklyWorkspace.clear();
    if (editor) editor.setValue("");

    file_name_select = "main." + (useMode === "block" ? "xml" : "py");

    {
        const board = boards.find(board => board && board.id === (boardId || "kidbright32-v1.3"));
        if (board?.defaultCode) {
            Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(board.defaultCode), blocklyWorkspace);
        }
    }

    if (useMode === "block") {
        updataWorkspaceAndCategoryFromvFS(true);
        blocklyWorkspace.setScale(1);
        blocklyWorkspace.scrollCenter();
    } else if (useMode === "code") {
        // fs.write("/main.py", "");
    }

    $("#project-name").val(projectName);

    $("#project-create-dialog").hide();
    NotifyS("New project " + projectName);
    statusLog("New project " + projectName);

    saveCodeToLocal();
});
