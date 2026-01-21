const inputs = document.querySelectorAll('.digit-input');
const setupMsg = document.getElementById('setupMessage');

// เก็บโจทย์ต้นฉบับไว้เทียบ
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

    // เก็บโจทย์เป็น Array เช่น ['1', '5', '3'...]
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

// --- 2. Game Logic (Strict Input) ---

function setupGameDisplay(digitString) {
    const solutionInput = document.getElementById('playerSolution');
    
    // 1. ใส่ตัวเลขลงไปในกล่องทันที
    solutionInput.value = digitString; 
    
    // 2. ป้องกันการ Copy / Cut / Paste (กันการโกง)
    solutionInput.onpaste = (e) => e.preventDefault();
    solutionInput.oncut = (e) => e.preventDefault();
    
    // 3. ดักจับการกดปุ่ม (หัวใจหลักของระบบล็อกเลข)
    solutionInput.onkeydown = function(e) {
        // อนุญาตปุ่มควบคุม: ลูกศรซ้ายขวา, Home, End
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
            return;
        }

        // อนุญาตปุ่มเครื่องหมาย: + - * / ( ) .
        if (['+', '-', '*', '/', '(', ')', '.'].includes(e.key)) {
            return; // ปล่อยให้พิมพ์ได้
        }

        // จัดการปุ่ม Backspace (ลบ)
        if (e.key === 'Backspace') {
            const cursorStart = this.selectionStart;
            const cursorEnd = this.selectionEnd;

            // ถ้ามีการลากคลุมดำ (Selection)
            if (cursorStart !== cursorEnd) {
                const selectedText = this.value.substring(cursorStart, cursorEnd);
                // ถ้าในส่วนที่คลุมดำ มีตัวเลขผสมอยู่ -> ห้ามลบ!
                if (/[0-9]/.test(selectedText)) {
                    e.preventDefault();
                }
                return;
            }

            // ถ้าลบตัวเดียว
            if (cursorStart > 0) {
                const charToDelete = this.value[cursorStart - 1];
                // เช็คว่าตัวที่จะลบเป็นตัวเลขไหม? ถ้าใช่ -> ห้ามลบ!
                if (/[0-9]/.test(charToDelete)) {
                    e.preventDefault();
                }
            }
            return;
        }

        // จัดการปุ่ม Delete (ลบไปข้างหน้า)
        if (e.key === 'Delete') {
            const cursorStart = this.selectionStart;
            const charToDelete = this.value[cursorStart];
            // ถ้าตัวที่จะลบเป็นตัวเลข -> ห้ามลบ!
            if (charToDelete && /[0-9]/.test(charToDelete)) {
                e.preventDefault();
            }
            return;
        }

        // บล็อกปุ่มอื่นๆ ทั้งหมด (รวมถึงตัวเลข 0-9 และตัวอักษร)
        // เพื่อไม่ให้พิมพ์เลขเพิ่ม หรือพิมพ์ตัวอักษรมั่ว
        e.preventDefault();
    };

    // คำนวณค่าเริ่มต้น (เพื่อเช็ค validation)
    calculate();
    solutionInput.focus();
    solutionInput.oninput = calculate;
}

// ฟังก์ชันสำหรับปุ่มกดบนหน้าจอ (Insert Text)
function insertText(text) {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // แทรกข้อความตรงตำแหน่ง Cursor
    const val = input.value;
    input.value = val.slice(0, start) + text + val.slice(end);
    
    // ขยับ Cursor ไปหลังตัวที่เพิ่งพิมพ์
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
    
    calculate();
}

// ฟังก์ชันจำลองปุ่ม Backspace บนหน้าจอ
function simulateBackspace() {
    const input = document.getElementById('playerSolution');
    const start = input.selectionStart;
    
    // ถ้า Cursor อยู่หน้าสุด ลบไม่ได้
    if (start === 0) return;

    // เช็คตัวข้างหน้า Cursor
    const charToDelete = input.value[start - 1];
    
    // ถ้าเป็นตัวเลข ห้ามลบ
    if (/[0-9]/.test(charToDelete)) return;

    // ถ้าไม่ใช่ตัวเลข (เป็นเครื่องหมาย) ให้ลบได้
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

    // 1. ตรวจสอบความถูกต้องของลำดับตัวเลข (Index Checking)
    // ดึงเฉพาะตัวเลขออกมาจากสิ่งที่พิมพ์
    const currentDigits = expr.replace(/[^0-9]/g, '').split('');

    // เทียบกับโจทย์ต้นฉบับว่าตรงกันทุกตำแหน่งไหม
    const isOrderCorrect = JSON.stringify(currentDigits) === JSON.stringify(currentProblemDigits);

    if (!isOrderCorrect) {
        // กรณีนี้ยากจะเกิดขึ้นเพราะเราบล็อกไว้แล้ว แต่กันเหนียวไว้
        resDisplay.innerText = "Error";
        resDisplay.style.color = "#ff3131";
        msg.innerHTML = "<h5>ลำดับตัวเลขไม่ถูกต้อง</h5>";
        return;
    }

    // ถ้าว่างเปล่า
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