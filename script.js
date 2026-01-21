const inputs = document.querySelectorAll('.digit-input');
const setupMsg = document.getElementById('setupMessage');

// เก็บโจทย์ 4 ตัว
let currentProblemDigits = []; 

// --- 1. Setup Logic ---
inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) { input.value = ''; return; }
        if (val.length > 1) { input.value = val.slice(-1); }

        if (input.value !== "" && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

function startGame() {
    let inputString = "";
    let isComplete = true;
    inputs.forEach(input => {
        if (input.value === "") isComplete = false;
        inputString += input.value;
    });

    if (!isComplete) {
        setupMsg.innerText = "กรุณากรอกตัวเลขให้ครบทั้ง 4 ช่อง";
        return;
    }

    // เก็บโจทย์ (4 ตัว)
    currentProblemDigits = inputString.split('').sort(); 

    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';
    
    setupGameDisplay(inputString);
}

function resetGame() {
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('setupPage').style.display = 'block';
    inputs.forEach(input => input.value = '');
    inputs[0].focus();
    setupMsg.innerText = '';
    
    document.getElementById('playerSolution').value = '';
    document.getElementById('currentValue').innerText = "0.00";
    document.getElementById('currentValue').style.color = "var(--neon-blue)";
    document.getElementById('message').innerText = "";
    currentProblemDigits = []; 
}

// --- 2. Game Logic ---

function setupGameDisplay(digitString) {
    const refContainer = document.getElementById('digitReference');
    refContainer.innerHTML = '';
    
    const digits = digitString.split('');
    digits.forEach(d => {
        const span = document.createElement('span');
        span.className = 'ref-digit';
        span.innerText = d;
        refContainer.appendChild(span);
    });

    const solutionInput = document.getElementById('playerSolution');
    solutionInput.value = ''; 
    solutionInput.focus();
    
    solutionInput.oninput = calculate;
}

function insertText(text) {
    const input = document.getElementById('playerSolution');
    input.value += text;
    input.focus();
    calculate();
}

function calculate() {
    const expr = document.getElementById('playerSolution').value;
    const resDisplay = document.getElementById('currentValue');
    const msg = document.getElementById('message');

    if (!expr.trim()) {
        resDisplay.innerText = "0.00";
        resDisplay.style.color = "#00d2ff";
        msg.innerHTML = "";
        return;
    }

    try {
        const cleanExpr = expr.replace(/[^0-9+\-*/(). ]/g, '');
        if(!cleanExpr) {
            resDisplay.innerText = "0.00";
            return;
        }

        const res = Function('"use strict";return (' + cleanExpr + ')')();
        
        if (Number.isFinite(res)) {
            resDisplay.innerText = res.toFixed(2);
            
            // 🔥 เป้าหมายคือ 24 🔥
            if (Math.abs(res - 24) < 1e-6) {
                
                // ตรวจสอบว่าใช้เลขครบ 4 ตัว และตรงกับโจทย์ไหม
                if (checkDigitsMatch(cleanExpr)) {
                    resDisplay.style.color = "#39ff14";
                    msg.innerHTML = "<h2 style='color:#39ff14; text-shadow:0 0 15px #39ff14'>MISSION COMPLETE!</h2>";
                } else {
                    resDisplay.style.color = "#ff3131";
                    msg.innerHTML = "<h3 style='color:#ff3131'>ใช้ตัวเลขไม่ตรงกับโจทย์!</h3>";
                }

            } else {
                resDisplay.style.color = "#00d2ff";
                msg.innerHTML = "";
            }
        }
    } catch (e) {
        resDisplay.innerText = "---";
        resDisplay.style.color = "#00d2ff";
        msg.innerHTML = "";
    }
}

// เช็คเลข 4 ตัว
function checkDigitsMatch(userEquation) {
    const userDigits = userEquation.match(/[0-9]/g);
    
    // ต้องมีเลข 4 ตัวเท่านั้น
    if (!userDigits || userDigits.length !== 4) {
        return false; 
    }

    const sortedUserDigits = userDigits.sort();
    return JSON.stringify(currentProblemDigits) === JSON.stringify(sortedUserDigits);
}