const inputs = document.querySelectorAll('.digit-input');
const setupMsg = document.getElementById('setupMessage');

// เก็บโจทย์ต้นฉบับ
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
        setupMsg.innerText = "กรุณากรอกตัวเลขให้ครบทั้ง 7 ช่อง";
        return;
    }

    currentProblemDigits = inputString.split('');

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
    const solutionInput = document.getElementById('playerSolution');
    
    // ใส่เลขลงกล่อง
    solutionInput.value = digitString; 
    
    // ห้าม Copy/Paste
    solutionInput.onpaste = (e) => e.preventDefault();
    solutionInput.oncut = (e) => e.preventDefault();
    
    // ระบบล็อกตัวเลข (ไม่ให้พิมพ์เพิ่ม / ไม่ให้ลบตัวเดิม)
    solutionInput.onkeydown = function(e) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) return;
        if (['+', '-', '*', '/', '(', ')', '.'].includes(e.key)) return;

        if (e.key === 'Backspace') {
            const cursorStart = this.selectionStart;
            const cursorEnd = this.selectionEnd;
            if (cursorStart !== cursorEnd) {
                const selectedText = this.value.substring(cursorStart, cursorEnd);
                if (/[0-9]/.test(selectedText)) e.preventDefault();
                return;
            }
            if (cursorStart > 0) {
                const charToDelete = this.value[cursorStart - 1];
                if (/[0-9]/.test(charToDelete)) e.preventDefault();
            }
            return;
        }

        if (e.key === 'Delete') {
            const charToDelete = this.value[this.selectionStart];
            if (charToDelete && /[0-9]/.test(charToDelete)) e.preventDefault();
            return;
        }

        // บล็อกปุ่มอื่นๆ (รวมถึงตัวเลข)
        e.preventDefault();
    };

    calculate();
    solutionInput.focus();
    solutionInput.oninput = calculate;
}

function insertText(text) {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
    
    calculate();
}

function simulateBackspace() {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    if (start === 0) return;

    const charToDelete = input.value[start - 1];
    if (/[0-9]/.test(charToDelete)) return; // ห้ามลบถ้าเป็นตัวเลข

    const val = input.value;
    input.value = val.slice(0, start - 1) + val.slice(start);
    input.selectionStart = input.selectionEnd = start - 1;
    input.focus();
    calculate();
}

function calculate() {
    const input = document.getElementById('playerSolution');
    const expr = input.value;
    const resDisplay = document.getElementById('currentValue');
    const msg = document.getElementById('message');

    // 🔴 1. เช็คว่ามี "เลขโดดต่อกัน" หรือไม่ (Concatenation Check)
    // RegExp: /\d+/g จะจับกลุ่มตัวเลขทั้งหมด (เช่น "1", "12", "5")
    const numberGroups = expr.match(/\d+/g);
    
    if (numberGroups) {
        // ถ้ามีกลุ่มไหนยาวกว่า 1 ตัวอักษร (เช่น "12") แสดงว่าเอามาต่อกัน
        const hasConcatenation = numberGroups.some(num => num.length > 1);
        
        if (hasConcatenation) {
            resDisplay.innerText = "Error";
            resDisplay.style.color = "#ff3131"; // สีแดง
            msg.innerHTML = "<h3 style='color:#ff3131'>ห้ามนำเลขโดดมาต่อกัน!</h3>";
            return; // หยุดคำนวณทันที
        }
    }

    // 🔵 2. เช็ค Validation อื่นๆ
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
            
            if (Math.abs(res - 100) < 1e-6) {
                resDisplay.style.color = "#39ff14";
                msg.innerHTML = "<h2 style='color:#39ff14; text-shadow:0 0 15px #39ff14'>MISSION COMPLETE!</h2>";
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