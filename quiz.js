document.addEventListener('DOMContentLoaded', async () => {
    let colorData = {};
    let allItemsWithImages = [];
    let score = 0;
    let questionCount = 0;
    const MAX_QUESTIONS = 10;
    let currentTarget = null;
    let categoryPool = [];

    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');
    const scoreEl = document.getElementById('score');
    const quizBody = document.getElementById('quiz-body');

    // Sound Synthesis
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(type) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
        }
    }

    try {
        const response = await fetch('色水_categorized.json?v=' + new Date().getTime());
        colorData = await response.json();
        
        // Prepare pool - now include items with EITHER image OR hex code
        Object.keys(colorData).forEach(cat => {
            const itemsInCat = colorData[cat].filter(item => item.圖片路徑 || item.色號);
            if (itemsInCat.length > 0) {
                categoryPool.push({ name: cat, items: itemsInCat });
            }
            itemsInCat.forEach(item => {
                allItemsWithImages.push({ ...item, category: cat });
            });
        });

        if (allItemsWithImages.length < 4) {
            questionEl.textContent = "資料不足，無法開始遊戲。";
            return;
        }

        startQuiz();
    } catch (error) {
        console.error(error);
        questionEl.textContent = "載入出錯";
    }

    function startQuiz() {
        score = 0;
        questionCount = 0;
        scoreEl.textContent = score;
        newQuestion();
    }

    function newQuestion() {
        if (questionCount >= MAX_QUESTIONS) {
            showResult();
            return;
        }

        questionCount++;
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
        nextBtn.classList.add('hidden');
        optionsEl.innerHTML = '';

        // Update score board to show progress
        scoreEl.innerHTML = `${score} (第 ${questionCount}/${MAX_QUESTIONS} 題)`;

        // Pick a category randomly
        const randomCatObj = categoryPool[Math.floor(Math.random() * categoryPool.length)];
        const itemsInCat = randomCatObj.items;
        currentTarget = itemsInCat[Math.floor(Math.random() * itemsInCat.length)];
        currentTarget.category = randomCatObj.name;

        // Show Kanji + Pronunciation
        questionEl.innerHTML = `
            <div style="font-size: 0.9rem; color: var(--accent-color); margin-bottom: 10px;">題號 ${questionCount}/${MAX_QUESTIONS}</div>
            <div>${currentTarget.詞目}</div>
            <div style="font-size: 1.5rem; color: var(--text-secondary); margin-top: 10px;">${currentTarget.音讀}</div>
        `;

        // Pick 3 distractors from DIFFERENT categories
        let distractors = [];
        let usedCategories = new Set([currentTarget.category]);
        
        let distractorPool = allItemsWithImages.filter(item => item.category !== currentTarget.category);
        distractorPool.sort(() => Math.random() - 0.5);

        for (let item of distractorPool) {
            if (!usedCategories.has(item.category) && distractors.length < 3) {
                distractors.push(item);
                usedCategories.add(item.category);
            }
        }

        if (distractors.length < 3) {
            let backupPool = allItemsWithImages.filter(item => item.詞目 !== currentTarget.詞目);
            backupPool.sort(() => Math.random() - 0.5);
            while (distractors.length < 3 && backupPool.length > 0) {
                let item = backupPool.pop();
                if (!distractors.find(d => d.詞目 === item.詞目)) distractors.push(item);
            }
        }

        let options = [currentTarget, ...distractors];
        options.sort(() => Math.random() - 0.5);

        options.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'option-card';
            
            // If image exists, show it; otherwise show solid color
            if (opt.圖片路徑) {
                card.innerHTML = `<div class="option-visual" style="background-image: url('${opt.圖片路徑}')"></div>`;
            } else {
                card.innerHTML = `<div class="option-visual" style="background-color: ${opt.色號}"></div>`;
            }
            
            card.onclick = () => checkAnswer(opt, card);
            optionsEl.appendChild(card);
        });
    }

    function checkAnswer(selected, cardEl) {
        if (!nextBtn.classList.contains('hidden')) return;

        if (selected.詞目 === currentTarget.詞目) {
            feedbackEl.textContent = '著矣！厲害喔！✨';
            feedbackEl.className = 'feedback correct';
            playSound('correct');
            score += 10;
        } else {
            feedbackEl.textContent = `敢按呢？毋著喔... 正確答案是「${currentTarget.詞目}」`;
            feedbackEl.className = 'feedback wrong';
            playSound('wrong');
            cardEl.style.borderColor = '#f87171';
            
            // Highlight correct one
            Array.from(optionsEl.children).forEach(child => {
                const visual = child.querySelector('.option-visual');
                const isCorrectImage = currentTarget.圖片路徑 && visual.style.backgroundImage.includes(currentTarget.圖片路徑);
                const isCorrectColor = !currentTarget.圖片路徑 && visual.style.backgroundColor.toLowerCase() === currentTarget.色號.toLowerCase();
                
                if (isCorrectImage || isCorrectColor) {
                    child.style.borderColor = '#4ade80';
                }
            });
        }
        
        scoreEl.innerHTML = `${score} (第 ${questionCount}/${MAX_QUESTIONS} 題)`;
        nextBtn.classList.remove('hidden');
        
        if (questionCount === MAX_QUESTIONS) {
            nextBtn.textContent = '查看結果';
        } else {
            nextBtn.textContent = '後一題';
        }

        setTimeout(() => {
            if (questionCount === MAX_QUESTIONS) {
                showResult();
            } else {
                newQuestion();
            }
        }, 2000);
    }

    function showResult() {
        quizBody.innerHTML = `
            <div class="question-text">挑戰結束！</div>
            <div style="font-size: 2rem; margin-bottom: 20px;">您的總分：<span class="correct">${score}</span> / 100</div>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">
                ${score >= 80 ? '你痟強的呢！你是色水達人！🥇' : '誠可惜，加練寡才閣來挑戰～'}
            </p>
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button id="restart-btn" class="nav-btn accent wide-btn">閣挑戰一擺</button>
                <a href="index.html" class="nav-btn wide-btn">轉去博物館</a>
            </div>
        `;
        document.getElementById('restart-btn').onclick = () => location.reload();
    }

    nextBtn.onclick = newQuestion;
});
