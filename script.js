const inputs = document.querySelectorAll('.digit-input');
const setupMsg = document.getElementById('setupMessage');
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
    
    solutionInput.value = digitString; 
    
    // ป้องกันการแก้ไขด้วยวิธีปกติ (Mouse/Keyboard)
    solutionInput.onpaste = (e) => e.preventDefault();
    solutionInput.oncut = (e) => e.preventDefault();
    
    solutionInput.onkeydown = function(e) {
        // อนุญาตปุ่มควบคุมทิศทาง
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) return;
        
        // ถ้าคีย์บอร์ดมีปุ่มเครื่องหมายพวกนี้ก็กดได้ (แต่ในมือถือเราปิดคีย์บอร์ดไว้)
        if (['+', '-', '*', '/', '(', ')', '.'].includes(e.key)) return;

        if (e.key === 'Backspace') {
            // Logic ห้ามลบตัวเลข
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

        // บล็อกทุกอย่างรวมถึงตัวเลข
        e.preventDefault();
    };

    calculate();
    // ไม่ต้อง auto focus บนมือถือเพราะคีย์บอร์ดจะเด้ง
    // solutionInput.focus(); 
    solutionInput.oninput = calculate;
}

function insertText(text) {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    
    // ขยับ Cursor ไปหลังตัวที่พิมพ์
    input.selectionStart = input.selectionEnd = start + text.length;
    
    // บนมือถือ input จะไม่ focus เพื่อไม่ให้คีย์บอร์ดเด้ง
    // แต่เรายังต้องคง focus ไว้เพื่อให้พิมพ์ต่อเนื่องได้ถ้าระบบอนุญาต
    input.focus();
    
    calculate();
}

function simulateBackspace() {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // ถ้ามีการเลือกคลุมดำ (Selection)
    if (start !== end) {
        const selectedText = input.value.substring(start, end);
        if (/[0-9]/.test(selectedText)) return; // ห้ามลบถ้าคลุมโดนเลข
        
        const val = input.value;
        input.value = val.slice(0, start) + val.slice(end);
        input.selectionStart = input.selectionEnd = start;
    } else {
        // ลบปกติทีละตัว
        if (start === 0) return;
        const charToDelete = input.value[start - 1];
        if (/[0-9]/.test(charToDelete)) return; // ห้ามลบเลข

        const val = input.value;
        input.value = val.slice(0, start - 1) + val.slice(start);
        input.selectionStart = input.selectionEnd = start - 1;
    }
    
    input.focus();
    calculate();
}

function calculate() {
    const input = document.getElementById('playerSolution');
    const expr = input.value;
    const resDisplay = document.getElementById('currentValue');
    const msg = document.getElementById('message');

    // ตรวจสอบเลขโดดติดกัน (Concatenation Check)
    const numberGroups = expr.match(/\d+/g);
    if (numberGroups) {
        const hasConcatenation = numberGroups.some(num => num.length > 1);
        if (hasConcatenation) {
            resDisplay.innerText = "Error";
            resDisplay.style.color = "#ff3131";
            msg.innerHTML = "<h3 style='color:#ff3131'>ห้ามนำเลขโดดมาต่อกัน!</h3>";
            return;
        }
    }

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