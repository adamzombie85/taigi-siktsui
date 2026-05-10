document.addEventListener('DOMContentLoaded', async () => {
    const colorGrid = document.getElementById('color-grid');
    const categoryNav = document.getElementById('category-nav');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    const gameBtn = document.getElementById('game-btn');
    
    let colorData = {};

    try {
        const response = await fetch('色水_categorized.json?v=' + new Date().getTime());
        colorData = await response.json();
        initApp();
    } catch (error) {
        console.error('Error loading color data:', error);
        colorGrid.innerHTML = `<p>無法載入資料，請檢查 JSON 檔案路徑。</p>`;
    }

    function initApp() {
        const catMap = {
            "紅色": "紅",
            "黃色": "黃",
            "藍色": "藍",
            "綠色": "綠",
            "黑色": "烏",
            "白色": "白",
            "灰色/殕色": "殕",
            "紫色": "紫",
            "咖啡色/土色": "塗",
            "非特定顏色/其他": "他"
        };
        const categoryRow = document.querySelector('.category-row');
        const categories = Object.keys(colorData);
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = catMap[cat] || cat.charAt(0);
            btn.dataset.category = cat;
            btn.onclick = () => filterCategory(cat, btn);
            categoryRow.appendChild(btn);
        });

        renderColors('all');
        
        // Listeners
        modalClose.onclick = () => modalOverlay.classList.add('hidden');
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
        };
        gameBtn.onclick = () => window.location.href = 'quiz.html';
        
        document.querySelector('[data-category="all"]').onclick = (e) => filterCategory('all', e.target);
    }

    function filterCategory(category, btn) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        else document.querySelector('[data-category="all"]').classList.add('active');
        renderColors(category);
    }

    function renderColors(filter) {
        colorGrid.innerHTML = '';
        let colorsToRender = [];
        if (filter === 'all') {
            Object.values(colorData).forEach(catList => {
                colorsToRender = [...colorsToRender, ...catList];
            });
        } else {
            colorsToRender = colorData[filter] || [];
        }

        colorsToRender.forEach(item => {
            const card = createColorCard(item);
            colorGrid.appendChild(card);
        });
    }

    function createColorCard(item) {
        const card = document.createElement('div');
        card.className = 'color-card';

        const hasImageClass = item.圖片路徑 ? 'has-image' : '';
        const visualStyle = item.圖片路徑 
            ? `background-image: url('${item.圖片路徑}');` 
            : `background-color: ${item.色號};`;

        card.innerHTML = `
            <div class="card-visual ${hasImageClass}" style="${visualStyle}">
                <div class="card-hex">${item.色號}</div>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${item.詞目}</h3>
                    <span class="card-reading">${item.音讀}</span>
                </div>
                <p class="card-definition">${item.釋義}</p>
            </div>
        `;

        card.onclick = () => openModal(item);
        return card;
    }

    function openModal(item) {
        const hasImageClass = item.圖片路徑 ? 'has-image' : '';
        const visualStyle = item.圖片路徑 
            ? `background-image: url('${item.圖片路徑}');` 
            : `background-color: ${item.色號};`;

        modalBody.innerHTML = `
            <div class="color-card">
                <div class="card-visual ${hasImageClass}" style="${visualStyle}">
                    <div class="card-hex">${item.色號}</div>
                </div>
                <div class="card-info">
                    <div class="card-header">
                        <h2 class="card-title">${item.詞目}</h2>
                        <span class="card-reading">${item.音讀}</span>
                    </div>
                    <p class="card-definition">${item.釋義}</p>
                </div>
            </div>
        `;
        modalOverlay.classList.remove('hidden');
    }
});
