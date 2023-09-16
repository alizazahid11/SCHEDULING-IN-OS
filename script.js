let selectedAlgorithm = document.getElementById('algo');
selectedAlgorithm.onchange = () => {
    checkTimeQuantumInput();
    checkPriorityCell();
};
document.getElementById('algo').addEventListener('change', function () {
    var selectedOption = this.value;
    var table = document.querySelector('.main-table');
    var addBtn = document.querySelector('.add-btn');
    var removeBtn = document.querySelector('.remove-btn');
let calc=document.getElementById('calculate');
let res=document.getElementById('reset');
let cs=document.getElementById('context-switch')
let cst=document.getElementById('cst')
    if (selectedOption === "") {
        table.classList.add('hide');
        addBtn.classList.add('hide');
        removeBtn.classList.add('hide');
  calc.classList.add('hide');
  res.classList.add('hide');
  cs.classList.add('hide');
  cst.classList.add('hide');
    } else {
        table.classList.remove('hide');
        addBtn.classList.remove('hide');
        removeBtn.classList.remove('hide');
        calc.classList.remove('hide');
        res.classList.remove('hide');
        cs.classList.remove('hide');
        cst.classList.remove('hide');
}
});

function inputOnChange() { 
    let inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
        if (input.type == 'number') {
            input.onchange = () => {
                let inputVal = Number(input.value);
                let isInt = Number.isInteger(inputVal);
                if (input.parentNode.classList.contains('arrival-time') ) //min 0 : arrival time
                {
                    if (!isInt || (isInt && inputVal < 0)) {
                        input.value = 0;
                    } else {
                        input.value = inputVal;
                    }
                } else //min 1 : time quantum, priority, burst time
                {
                    if (!isInt || (isInt && inputVal < 1)) {
                        input.value = 1;
                    } else {
                        input.value = inputVal;
                    }
                }
            }
        }
    });
}
inputOnChange();
let process = 1;
//resize burst time rows size on +/-

function gcd(x, y) {
    while (y) {
        let t = y;
        y = x % y;
        x = t;
    }
    return x;
}

function lcm(x, y) {
    return (x * y) / gcd(x, y);
}

function lcmAll() {
    let result = 1;
    for (let i = 0; i < process; i++) {
        result = lcm(result, document.querySelector(".main-table").rows[2 * i + 2].cells.length);
    }
    return result;
}

function updateColspan() { //update burst time cell colspan
    let totalColumns = lcmAll();
    let processHeading = document.querySelector("thead .process-time");
    processHeading.setAttribute("colspan", totalColumns);
    let processTimes = [];
    let table = document.querySelector(".main-table");
    for (let i = 0; i < process; i++) {
        let row = table.rows[2 * i + 2].cells;
        processTimes.push(row.length);
    }
    for (let i = 0; i < process; i++) {
        let row1 = table.rows[2 * i + 1].cells;
        let row2 = table.rows[2 * i + 2].cells;
        for (let j = 0; j < processTimes[i]; j++) {
            row1[j + 3].setAttribute("colspan", totalColumns / processTimes[i]);
            row2[j].setAttribute("colspan", totalColumns / processTimes[i]);
        }
    }
}

function addProcess() {
    process++;
    let rowHTML1 = `
                          <td class="process-id" rowspan="2">P${process}</td>
                          <td class="priority hide" rowspan="2"><input type="number" min="1" step="1" value="1"></td>
                          <td class="arrival-time" rowspan="2"><input type="number" min="0" step="1" value="0"> </td>
                       
                      `;
    let rowHTML2 = `
                           <td class="process-time cpu process-input"><input type="number" min="1" step="1" value="1"> </td>
                      `;
    let table = document.querySelector(".main-table tbody");
    table.insertRow(table.rows.length).innerHTML = rowHTML1;
    table.insertRow(table.rows.length).innerHTML = rowHTML2;
    checkPriorityCell();
    addremove();
    updateColspan();
    inputOnChange();
}

function deleteProcess() {
    let table = document.querySelector(".main-table");
    if (process > 1) {
        table.deleteRow(table.rows.length - 1);
        table.deleteRow(table.rows.length - 1);
        process--;
    }
    updateColspan();
    inputOnChange();
}

document.querySelector(".add-btn").onclick = () => { //add row event listener
    addProcess();
};
document.querySelector(".remove-btn").onclick = () => { //remove row event listener
    deleteProcess();
};
//------------------------
class Input {
    constructor() {
        this.processId = [];
        this.priority = [];
        this.arrivalTime = [];
        this.processTime = [];
        this.processTimeLength = [];
        this.totalBurstTime = [];
        this.algorithm = "";
        this.algorithmType = "";
        this.timeQuantum = 0;
        this.contextSwitch = 0;
    }
}
class Utility {
    constructor() {
        this.remainingProcessTime = [];
        this.remainingBurstTime = [];
        this.remainingTimeRunning = [];
        this.currentProcessIndex = [];
        this.start = [];
        this.done = [];
        this.returnTime = [];
        this.currentTime = 0;
    }
}
class Output {
    constructor() {
        this.completionTime = [];
        this.turnAroundTime = [];
        this.waitingTime = [];
        this.responseTime = [];
        this.schedule = [];
        this.timeLog = [];
        this.contextSwitches = 0;
        this.averageTimes = []; //ct,tat,wt,rt
    }
}
class TimeLog {
    constructor() {
        this.time = -1;
        this.remain = [];
        this.ready = [];
        this.running = [];
        this.block = [];
        this.terminate = [];
        this.move = []; //0-remain->ready 1-ready->running 2-running->terminate 3-running->ready 4-running->block 5-block->ready
    }
}

function setAlgorithmNameType(input, algorithm) {
    input.algorithm = algorithm;
    switch (algorithm) {
        case 'sjf':
        case 'hrrn':
            input.algorithmType = "nonpreemptive";
            break;
        case 'srtf':
            input.algorithmType = "preemptive";
            break;
       
    }
}

function setInput(input) {
    for (let i = 1; i <= process; i++) {
        input.processId.push(i - 1);
        let rowCells1 = document.querySelector(".main-table").rows[2 * i - 1].cells;
        let rowCells2 = document.querySelector(".main-table").rows[2 * i].cells;
        input.priority.push(Number(rowCells1[1].firstElementChild.value));
        input.arrivalTime.push(Number(rowCells1[2].firstElementChild.value));
        let ptn = Number(rowCells2.length);
        let pta = [];
        for (let j = 0; j < ptn; j++) {
            pta.push(Number(rowCells2[j].firstElementChild.value));
        }
        input.processTime.push(pta);
        input.processTimeLength.push(ptn);
    }
    //total burst time for each process
    input.totalBurstTime = new Array(process).fill(0);
    input.processTime.forEach((e1, i) => {
        e1.forEach((e2, j) => {
            if (j % 2 == 0) {
                input.totalBurstTime[i] += e2;
            }
        });
    });
    setAlgorithmNameType(input, selectedAlgorithm.value);
    input.timeQuantum = Number(document.querySelector("#tq").value);
}

function setUtility(input, utility) {
    utility.remainingProcessTime = input.processTime.slice();
    utility.remainingBurstTime = input.totalBurstTime.slice();
    utility.remainingTimeRunning = new Array(process).fill(0);
    utility.currentProcessIndex = new Array(process).fill(0);
    utility.start = new Array(process).fill(false);
    utility.done = new Array(process).fill(false);
    utility.returnTime = input.arrivalTime.slice();
}

function reduceSchedule(schedule) {
    let newSchedule = [];
    let currentScheduleElement = schedule[0][0];
    let currentScheduleLength = schedule[0][1];
    for (let i = 1; i < schedule.length; i++) {
        if (schedule[i][0] == currentScheduleElement) {
            currentScheduleLength += schedule[i][1];
        } else {
            newSchedule.push([currentScheduleElement, currentScheduleLength]);
            currentScheduleElement = schedule[i][0];
            currentScheduleLength = schedule[i][1];
        }
    }
    newSchedule.push([currentScheduleElement, currentScheduleLength]);
    return newSchedule;
}

function reduceTimeLog(timeLog) {
    let timeLogLength = timeLog.length;
    let newTimeLog = [],
        j = 0;
    for (let i = 0; i < timeLogLength - 1; i++) {
        if (timeLog[i] != timeLog[i + 1]) {
            newTimeLog.push(timeLog[j]);
        }
        j = i + 1;
    }
    if (j == timeLogLength - 1) {
        newTimeLog.push(timeLog[j]);
    }
    return newTimeLog;
}

function outputAverageTimes(output) {
    let avgct = 0;
    output.completionTime.forEach((element) => {
        avgct += element;
    });
    avgct /= process;
    let avgtat = 0;
    output.turnAroundTime.forEach((element) => {
        avgtat += element;
    });
    avgtat /= process;
    let avgwt = 0;
    output.waitingTime.forEach((element) => {
        avgwt += element;
    });
    avgwt /= process;
    let avgrt = 0;
    output.responseTime.forEach((element) => {
        avgrt += element;
    });
    avgrt /= process;
    return [avgct, avgtat, avgwt, avgrt];
}

function setOutput(input, output) {
    //set turn around time and waiting time
    for (let i = 0; i < process; i++) {
        output.turnAroundTime[i] = output.completionTime[i] - input.arrivalTime[i];
        output.waitingTime[i] = output.turnAroundTime[i] - input.totalBurstTime[i];
    }
    output.schedule = reduceSchedule(output.schedule);
    output.timeLog = reduceTimeLog(output.timeLog);
    output.averageTimes = outputAverageTimes(output);
}

function getDate(sec) {
    return (new Date(0, 0, 0, 0, sec / 60, sec % 60));
}

function showGanttChart(output, outputDiv) {
    let ganttChartHeading = document.createElement("h3");
    ganttChartHeading.innerHTML = "Gantt Chart";
    outputDiv.appendChild(ganttChartHeading);
    let ganttChartData = [];
    let startGantt = 0;
    output.schedule.forEach((element) => {
        if (element[0] == -2) { //context switch
            ganttChartData.push([
                "Time",
                "CS",
                "grey",
                getDate(startGantt),
                getDate(startGantt + element[1])
            ]);

        } else if (element[0] == -1) { //nothing
            ganttChartData.push([
                "Time",
                "Empty",
                "black",
                getDate(startGantt),
                getDate(startGantt + element[1])
            ]);

        } else { //process 
            ganttChartData.push([
                "Time",
                "P" + element[0],
                "",
                getDate(startGantt),
                getDate(startGantt + element[1])
            ]);
        }
        startGantt += element[1];
    });
    let ganttChart = document.createElement("div");
    ganttChart.id = "gantt-chart";

    google.charts.load("current", { packages: ["timeline"] });
    google.charts.setOnLoadCallback(drawGanttChart);

    function drawGanttChart() {
        var container = document.getElementById("gantt-chart");
        var chart = new google.visualization.Timeline(container);
        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: "string", id: "Gantt Chart" });
        dataTable.addColumn({ type: "string", id: "Process" });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: "date", id: "Start" });
        dataTable.addColumn({ type: "date", id: "End" });
        dataTable.addRows(ganttChartData);
        let ganttWidth = '100%';
        if (startGantt >= 20) {
            ganttWidth = 0.05 * startGantt * screen.availWidth;
        }
        var options = {
            width: ganttWidth,
            timeline: {
                showRowLabels: false,
                avoidOverlappingGridLines: false
            }
        };
        chart.draw(dataTable, options);
    }
    outputDiv.appendChild(ganttChart);
}
function showFinalTable(input, output, outputDiv) {
    let finalTableHeading = document.createElement("h2");
    finalTableHeading.innerHTML = "Final Table";
    outputDiv.appendChild(finalTableHeading);
    let table = document.createElement("table");
    table.classList.add("final-table");
    let thead = table.createTHead();
    let row = thead.insertRow(0);
    let headings = [
        "Process",
        "Arrival Time",
        "Total Burst Time",
        "Completion Time",
        "Turn Around Time",
        "Waiting Time",
        "Response Time",
    ];
    headings.forEach((element, index) => {
        let cell = row.insertCell(index);
        cell.innerHTML = element;
    });
    let tbody = table.createTBody();
    for (let i = 0; i < process; i++) {
        let row = tbody.insertRow(i);
        let cell = row.insertCell(0);
        cell.innerHTML = "P" + (i + 1);
        cell = row.insertCell(1);
        cell.innerHTML = input.arrivalTime[i];
        cell = row.insertCell(2);
        cell.innerHTML = input.totalBurstTime[i];
        cell = row.insertCell(3);
        cell.innerHTML = output.completionTime[i];
        cell = row.insertCell(4);
        cell.innerHTML = output.turnAroundTime[i];
        cell = row.insertCell(5);
        cell.innerHTML = output.waitingTime[i];
        cell = row.insertCell(6);
        cell.innerHTML = output.responseTime[i];
    }
    outputDiv.appendChild(table);

    let tbt = 0;
    input.totalBurstTime.forEach((element) => (tbt += element));
    let lastct = 0;
    output.completionTime.forEach((element) => (lastct = Math.max(lastct, element)));

    let cpu = document.createElement("h5");
    cpu.innerHTML = "CPU Utilization : " + (tbt / lastct) * 100 + "%";
    outputDiv.appendChild(cpu);
}

function toggleTimeLogArrowColor(timeLog, color) {
    let timeLogMove = ['remain-ready', 'ready-running', 'running-terminate', 'running-ready', 'running-block', 'block-ready'];
    timeLog.move.forEach(element => {
        document.getElementById(timeLogMove[element]).style.color = color;
    });
}

function nextTimeLog(timeLog) {
    let timeLogTableDiv = document.getElementById("time-log-table-div");

    let arrowHTML = `
    <p id = "remain-ready" class = "arrow">&rarr;</p>
    <p id = "ready-running" class = "arrow">&#10554;</p>
    <p id = "running-ready" class = "arrow">&#10554;</p>
    <p id = "running-terminate" class = "arrow">&rarr;</p>
    <p id = "running-block" class = "arrow">&rarr;</p>
    <p id = "block-ready" class = "arrow">&rarr;</p>
    `;
    timeLogTableDiv.innerHTML = arrowHTML;

    let remainTable = document.createElement("table");
    remainTable.id = "remain-table";
    remainTable.className = 'time-log-table';
    let remainTableHead = remainTable.createTHead();
    let remainTableHeadRow = remainTableHead.insertRow(0);
    let remainTableHeading = remainTableHeadRow.insertCell(0);
    remainTableHeading.innerHTML = "Remain";
    let remainTableBody = remainTable.createTBody();
    for (let i = 0; i < timeLog.remain.length; i++) {
        let remainTableBodyRow = remainTableBody.insertRow(i);
        let remainTableValue = remainTableBodyRow.insertCell(0);
        remainTableValue.innerHTML = 'P' + (timeLog.remain[i] + 1);
    }
    timeLogTableDiv.appendChild(remainTable);

    let readyTable = document.createElement("table");
    readyTable.id = "ready-table";
    readyTable.className = 'time-log-table';
    let readyTableHead = readyTable.createTHead();
    let readyTableHeadRow = readyTableHead.insertRow(0);
    let readyTableHeading = readyTableHeadRow.insertCell(0);
    readyTableHeading.innerHTML = "Ready";
    let readyTableBody = readyTable.createTBody();
    for (let i = 0; i < timeLog.ready.length; i++) {
        let readyTableBodyRow = readyTableBody.insertRow(i);
        let readyTableValue = readyTableBodyRow.insertCell(0);
        readyTableValue.innerHTML = 'P' + (timeLog.ready[i] + 1);
    }
    timeLogTableDiv.appendChild(readyTable);

    let runningTable = document.createElement("table");
    runningTable.id = "running-table";
    runningTable.className = 'time-log-table';
    let runningTableHead = runningTable.createTHead();
    let runningTableHeadRow = runningTableHead.insertRow(0);
    let runningTableHeading = runningTableHeadRow.insertCell(0);
    runningTableHeading.innerHTML = "Running";
    let runningTableBody = runningTable.createTBody();
    for (let i = 0; i < timeLog.running.length; i++) {
        let runningTableBodyRow = runningTableBody.insertRow(i);
        let runningTableValue = runningTableBodyRow.insertCell(0);
        runningTableValue.innerHTML = 'P' + (timeLog.running[i] + 1);
    }
    timeLogTableDiv.appendChild(runningTable);

    let blockTable = document.createElement("table");
    blockTable.id = "block-table";
    blockTable.className = 'time-log-table';
    let blockTableHead = blockTable.createTHead();
    let blockTableHeadRow = blockTableHead.insertRow(0);
    let blockTableHeading = blockTableHeadRow.insertCell(0);
    blockTableHeading.innerHTML = "Block";
    let blockTableBody = blockTable.createTBody();
    for (let i = 0; i < timeLog.block.length; i++) {
        let blockTableBodyRow = blockTableBody.insertRow(i);
        let blockTableValue = blockTableBodyRow.insertCell(0);
        blockTableValue.innerHTML = 'P' + (timeLog.block[i] + 1);
    }
    timeLogTableDiv.appendChild(blockTable);

    let terminateTable = document.createElement("table");
    terminateTable.id = "terminate-table";
    terminateTable.className = 'time-log-table';
    let terminateTableHead = terminateTable.createTHead();
    let terminateTableHeadRow = terminateTableHead.insertRow(0);
    let terminateTableHeading = terminateTableHeadRow.insertCell(0);
    terminateTableHeading.innerHTML = "Terminate";
    let terminateTableBody = terminateTable.createTBody();
    for (let i = 0; i < timeLog.terminate.length; i++) {
        let terminateTableBodyRow = terminateTableBody.insertRow(i);
        let terminateTableValue = terminateTableBodyRow.insertCell(0);
        terminateTableValue.innerHTML = 'P' + (timeLog.terminate[i] + 1);
    }
    timeLogTableDiv.appendChild(terminateTable);
    document.getElementById("time-log-time").innerHTML = "Time : " + timeLog.time;
}

function showTimeLog(output, outputDiv) {
    reduceTimeLog(output.timeLog);
    let timeLogDiv = document.createElement("div");
    timeLogDiv.id = "time-log-div";
    timeLogDiv.style.height = (15 * process) + 300 + "px";
    let startTimeLogButton = document.createElement("button");
    startTimeLogButton.id = "start-time-log";
    startTimeLogButton.innerHTML = "Start Time Log";
    timeLogDiv.appendChild(startTimeLogButton);
    outputDiv.appendChild(timeLogDiv);

    document.querySelector("#start-time-log").onclick = () => {
        timeLogStart = 1;
        let timeLogDiv = document.getElementById("time-log-div");
        let timeLogOutputDiv = document.createElement("div");
        timeLogOutputDiv.id = "time-log-output-div";

        let timeLogTableDiv = document.createElement("div");
        timeLogTableDiv.id = "time-log-table-div";

        let timeLogTime = document.createElement("p");
        timeLogTime.id = "time-log-time";

        timeLogOutputDiv.appendChild(timeLogTableDiv);
        timeLogOutputDiv.appendChild(timeLogTime);
        timeLogDiv.appendChild(timeLogOutputDiv);
        let index = 0;
        let timeLogInterval = setInterval(() => {
            nextTimeLog(output.timeLog[index]);
            if (index != output.timeLog.length - 1) {
                setTimeout(() => {
                    toggleTimeLogArrowColor(output.timeLog[index], 'red');
                    setTimeout(() => {
                        toggleTimeLogArrowColor(output.timeLog[index], 'black');
                    }, 600);
                }, 200);
            }
            index++;
            if (index == output.timeLog.length) {
                clearInterval(timeLogInterval);
            }
            document.getElementById("calculate").onclick = () => {
                clearInterval(timeLogInterval);
                document.getElementById("time-log-output-div").innerHTML = "";
                calculateOutput();
            }
        }, 1000);
    };
}
function showOutput(input, output, outputDiv) {
    showGanttChart(output, outputDiv);
    outputDiv.insertAdjacentHTML("beforeend", "<hr>");
    showFinalTable(input, output, outputDiv);

    // Calculate and display average waiting time and average turnaround time
    let avgWaitingTime = calculateAverageWaitingTime(output);
    let avgTurnaroundTime = calculateAverageTurnaroundTime(output);

    let avgWaitTimeElement = document.createElement("h5");
    avgWaitTimeElement.innerHTML = "Average Waiting Time: " + avgWaitingTime.toFixed(2);
    outputDiv.appendChild(avgWaitTimeElement);

    let avgTurnaroundTimeElement = document.createElement("h5");
    avgTurnaroundTimeElement.innerHTML = "Average Turnaround Time: " + avgTurnaroundTime.toFixed(2);
    outputDiv.appendChild(avgTurnaroundTimeElement);

    outputDiv.insertAdjacentHTML("beforeend", "<hr>");
    showTimeLog(output, outputDiv);
    outputDiv.insertAdjacentHTML("beforeend", "<hr>");
}
function CPUScheduler(input, utility, output) {
    function updateReadyQueue(currentTimeLog) {
        let candidatesRemain = currentTimeLog.remain.filter((element) => input.arrivalTime[element] <= currentTimeLog.time);
        if (candidatesRemain.length > 0) {
            currentTimeLog.move.push(0);
        }
        let candidatesBlock = currentTimeLog.block.filter((element) => utility.returnTime[element] <= currentTimeLog.time);
        if (candidatesBlock.length > 0) {
            currentTimeLog.move.push(5);
        }
        let candidates = candidatesRemain.concat(candidatesBlock);
        candidates.sort((a, b) => utility.returnTime[a] - utility.returnTime[b]);
        candidates.forEach(element => {
            moveElement(element, currentTimeLog.remain, currentTimeLog.ready);
            moveElement(element, currentTimeLog.block, currentTimeLog.ready);
        });
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
        currentTimeLog.move = [];
    }

    function moveElement(value, from, to) { //if present in from and not in to
        let index = from.indexOf(value);
        if (index != -1) {
            from.splice(index, 1);
        }
        if (to.indexOf(value) == -1) {
            to.push(value);
        }
    }
    let currentTimeLog = new TimeLog();
    currentTimeLog.remain = input.processId;
    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    currentTimeLog.move = [];
    currentTimeLog.time++;
    let lastFound = -1;
    while (utility.done.some((element) => element == false)) {
        updateReadyQueue(currentTimeLog);
        let found = -1;
        if (currentTimeLog.running.length == 1) {
            found = currentTimeLog.running[0];
        } else if (currentTimeLog.ready.length > 0) {
            if (input.algorithm == 'rr') {
                found = currentTimeLog.ready[0];
                utility.remainingTimeRunning[found] = Math.min(utility.remainingProcessTime[found][utility.currentProcessIndex[found]], input.timeQuantum);
            } else {
                let candidates = currentTimeLog.ready;
                candidates.sort((a, b) => a - b);
                candidates.sort((a, b) => {
                    switch (input.algorithm) {
                        
                        case 'sjf':
                        case 'srtf':
                            return utility.remainingBurstTime[a] - utility.remainingBurstTime[b];
                        case 'hrrn':
                            function responseRatio(id) {
                                let s = utility.remainingBurstTime[id];
                                let w = currentTimeLog.time - input.arrivalTime[id] - s;
                                return 1 + w / s;
                            }
                            return responseRatio(b) - responseRatio(a);
                    }
                });
                found = candidates[0];
                if (input.algorithmType == "preemptive" && found >= 0 && lastFound >= 0 && found != lastFound) { //context switch
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) {
                        output.contextSwitches++;
                    }
                }
            }
            moveElement(found, currentTimeLog.ready, currentTimeLog.running);
            currentTimeLog.move.push(1);
            output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
            currentTimeLog.move = [];
            if (utility.start[found] == false) {
                utility.start[found] = true;
                output.responseTime[found] = currentTimeLog.time - input.arrivalTime[found];
            }
        }
        currentTimeLog.time++;
        if (found != -1) {
            output.schedule.push([found + 1, 1]);
            utility.remainingProcessTime[found][utility.currentProcessIndex[found]]--;
            utility.remainingBurstTime[found]--;

            if (input.algorithm == 'rr') {
                utility.remainingTimeRunning[found]--;
                if (utility.remainingTimeRunning[found] == 0) {
                    if (utility.remainingProcessTime[found][utility.currentProcessIndex[found]] == 0) {
                        utility.currentProcessIndex[found]++;
                        if (utility.currentProcessIndex[found] == input.processTimeLength[found]) {
                            utility.done[found] = true;
                            output.completionTime[found] = currentTimeLog.time;
                            moveElement(found, currentTimeLog.running, currentTimeLog.terminate);
                            currentTimeLog.move.push(2);
                        } else {
                            utility.returnTime[found] = currentTimeLog.time + input.processTime[found][utility.currentProcessIndex[found]];
                            utility.currentProcessIndex[found]++;
                            moveElement(found, currentTimeLog.running, currentTimeLog.block);
                            currentTimeLog.move.push(4);
                        }
                        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                        currentTimeLog.move = [];
                        updateReadyQueue(currentTimeLog);
                    } else {
                        updateReadyQueue(currentTimeLog);
                        moveElement(found, currentTimeLog.running, currentTimeLog.ready);
                        currentTimeLog.move.push(3);
                        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                        currentTimeLog.move = [];
                    }
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) {
                        output.contextSwitches++;
                    }
                }
            } else { //preemptive and non-preemptive
                if (utility.remainingProcessTime[found][utility.currentProcessIndex[found]] == 0) {
                    utility.currentProcessIndex[found]++;
                    if (utility.currentProcessIndex[found] == input.processTimeLength[found]) {
                        utility.done[found] = true;
                        output.completionTime[found] = currentTimeLog.time;
                        moveElement(found, currentTimeLog.running, currentTimeLog.terminate);
                        currentTimeLog.move.push(2);
                    } else {
                        utility.returnTime[found] = currentTimeLog.time + input.processTime[found][utility.currentProcessIndex[found]];
                        utility.currentProcessIndex[found]++;
                        moveElement(found, currentTimeLog.running, currentTimeLog.block);
                        currentTimeLog.move.push(4);
                    }
                    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                    currentTimeLog.move = [];
                    if (currentTimeLog.running.length == 0) { //context switch
                        output.schedule.push([-2, input.contextSwitch]);
                        for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                            updateReadyQueue(currentTimeLog);
                        }
                        if (input.contextSwitch > 0) {
                            output.contextSwitches++;
                        }
                    }
                    lastFound = -1;
                } else if (input.algorithmType == "preemptive") {
                    moveElement(found, currentTimeLog.running, currentTimeLog.ready);
                    currentTimeLog.move.push(3);
                    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                    currentTimeLog.move = [];
                    lastFound = found;
                }
            }
        } else {
            output.schedule.push([-1, 1]);
            lastFound = -1;
        }
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    }
    output.schedule.pop();
}
function calculateAverageWaitingTime(output) {
    let totalWaitingTime = output.waitingTime.reduce((acc, wt) => acc + wt, 0);
    return totalWaitingTime / process;
}

function calculateAverageTurnaroundTime(output) {
    let totalTurnaroundTime = output.turnAroundTime.reduce((acc, tat) => acc + tat, 0);
    return totalTurnaroundTime / process;
}

function calculateOutput() {
    let outputDiv = document.getElementById("output");
    outputDiv.innerHTML = "";
    let mainInput = new Input();
    let mainUtility = new Utility();
    let mainOutput = new Output();
    setInput(mainInput);
    setUtility(mainInput, mainUtility);
    CPUScheduler(mainInput, mainUtility, mainOutput);
    setOutput(mainInput, mainOutput);
    showOutput(mainInput, mainOutput, outputDiv);
}

document.getElementById("calculate").onclick = () => {
    calculateOutput();
};