// 全域變數儲存資料
let vegetables = [];
let recipes = [];
let vegNameMapping = {};
let chartInstances = {}; // 用於存儲圖表實例

// DOM 元素
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const chatToggle = document.getElementById('chatToggle');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    loadVegNameMapping();
    loadRecipesData();
    setupEventListeners();
});

// 讀取蔬菜名稱對照表
async function loadVegNameMapping() {
    try {
        const response = await fetch('veg_name.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n');
        lines.forEach((line, index) => {
            if (index === 0 || !line.trim()) return;
            const [chinese, english] = line.split(',');
            if (chinese && english) {
                vegNameMapping[chinese.trim()] = english.trim();
            }
        });
    } catch (error) {
        console.error('載入蔬菜名稱對照表失敗:', error);
        vegNameMapping = { '大白菜': 'Chinese Cabbage', '青江菜': 'Bok Choy', '空心菜': 'Water Spinach', '地瓜葉': 'Sweet Potato Leaves', '番茄': 'Tomato', '黃瓜': 'Cucumber' };
    } finally {
        generateVegetablesData();
    }
}

// 讀取食譜資料
async function loadRecipesData() {
    try {
        const response = await fetch('大白菜_清理後食譜.csv');
        const csvText = await response.text();
        recipes = csvText.split('\n').slice(1).map((line, index) => {
            if (!line.trim()) return null;
            const columns = parseCSVLine(line);
            if (columns.length < 7) return null;
            const [id, name, url, preview_ingredients, ingredients, steps] = columns;
            return {
                id: parseInt(id) || (index + 1000), name,
                image: `https://source.unsplash.com/400x300/?food,dish,${parseInt(id)}`,
                ingredients: ingredients.split('|').map(item => ({ name: item.trim().split(' ')[0], amount: item.trim().split(' ').slice(1).join(' ') || '適量' })),
                description: preview_ingredients.substring(0, 80) + '...', // 增加描述長度
                cookTime: '30分鐘', difficulty: '簡單', servings: '2-3人份',
                steps: steps.split('|').map((step, stepIndex) => ({ step: stepIndex + 1, description: step.trim(), image: `https://source.unsplash.com/400x300/?cooking,step,${parseInt(id) + stepIndex}` })),
            };
        }).filter(Boolean);
        renderRecipes();
    } catch (error) {
        console.error('載入食譜資料失敗:', error);
    }
}

// 解析CSV行
function parseCSVLine(line) {
    const result = [];
    let current = '', inQuotes = false;
    for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
    }
    result.push(current.trim());
    return result;
}

// 生成蔬菜假資料
function generateVegetablesData() {
    const vegNames = Object.keys(vegNameMapping);
    const seasons = ['春季', '夏季', '秋季', '冬季', '四季'];
    vegetables = vegNames.map((name, index) => {
        const basePrice = 20 + Math.random() * 40;
        const priceHistory = Array.from({ length: 30 }, (_, i) => Math.max(10, Math.round(basePrice + (Math.random() - 0.5) * (15 - i * 0.4))));
        const currentPrice = priceHistory[priceHistory.length - 1];
        const previousPrice = priceHistory[priceHistory.length - 2];
        const priceChange = ((currentPrice - previousPrice) / previousPrice * 100).toFixed(1);

        return {
            id: index + 1, name, image: `images/${name}.jpg`, description: `新鮮${name}，營養豐富，是您餐桌上的最佳選擇。`,
            nutrition: { '熱量': Math.round(15 + Math.random() * 35), '纖維': Math.round((1 + Math.random() * 4) * 10) / 10, '維生素C': Math.round(10 + Math.random() * 90), '維生素A': Math.round(Math.random() * 500), '鐵質': Math.round((0.3 + Math.random() * 2.7) * 10) / 10, '鈣質': Math.round(10 + Math.random() * 140) },
            priceHistory, currentPrice, priceChange: `${priceChange >= 0 ? '+' : ''}${priceChange}%`, season: seasons[Math.floor(Math.random() * seasons.length)],
        };
    });
    renderVegetables();
    renderPricePredictions();
}

// 渲染蔬菜總覽卡片
function renderVegetables() {
    const grid = document.getElementById('vegetableGrid');
    if (!grid) return;
    grid.innerHTML = vegetables.map(veg => `
        <div class="vegetable-card" onclick="showVegetableDetail(${veg.id})" data-name="${veg.name.toLowerCase()}">
            <img src="${veg.image}" alt="${veg.name}" loading="lazy">
            <div class="card-content">
                <h3>${veg.name}</h3>
                <p>${veg.description}</p>
                <div class="price-info">
                    <span class="current-price">NT$ ${veg.currentPrice}</span>
                    <span class="price-change ${veg.priceChange.includes('+') ? 'increase' : 'decrease'}">
                        ${veg.priceChange}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染價格預測頁面
function renderPricePredictions() {
    const container = document.getElementById('priceResults');
    if (!container) return;
    container.innerHTML = vegetables.map(veg => `
        <div class="price-card" data-name="${veg.name.toLowerCase()}">
            <div class="price-card-info">
                <img src="${veg.image}" alt="${veg.name}" loading="lazy">
                <div class="price-card-details">
                    <h3>${veg.name}</h3>
                    <div class="price-info">
                        <span>當前價格: NT$ ${veg.currentPrice}</span>
                        <span class="${veg.priceChange.includes('+') ? 'increase' : 'decrease'}">${veg.priceChange}</span>
                    </div>
                </div>
            </div>
            <div class="price-card-chart-container">
                 <div class="time-select">
                    <button onclick="updatePriceChart(event, 'price-page-chart-${veg.id}', ${veg.id}, 7, this)">近7天</button>
                    <button onclick="updatePriceChart(event, 'price-page-chart-${veg.id}', ${veg.id}, 14, this)">近14天</button>
                    <button class="active" onclick="updatePriceChart(event, 'price-page-chart-${veg.id}', ${veg.id}, 30, this)">近30天</button>
                 </div>
                <div class="price-card-chart">
                    <canvas id="price-page-chart-${veg.id}"></canvas>
                </div>
            </div>
        </div>
    `).join('');

    setTimeout(() => {
        vegetables.forEach(veg => {
            updatePriceChart(null, `price-page-chart-${veg.id}`, veg.id, 30);
        });
    }, 100);
}

// 通用的圖表更新函式
function updatePriceChart(event, canvasId, vegId, days, btnElement = null) {
    if (event) event.stopPropagation();
    const vegetable = vegetables.find(v => v.id === vegId);
    if (!vegetable) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (btnElement) {
        btnElement.parentElement.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const history = vegetable.priceHistory;
    const data = history.slice(Math.max(0, history.length - days));
    const labels = Array.from({ length: data.length }, (_, i) => `前${data.length - i}天`);
    renderLineChart(canvas, labels, data, '價格', false);
}

// Chart.js 渲染線圖
function renderLineChart(canvas, labels, data, label, showLegend = true) {
    const chartId = canvas.id;
    if (chartInstances[chartId]) chartInstances[chartId].destroy();
    chartInstances[chartId] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ label, data, borderColor: 'var(--primary-green)', backgroundColor: 'rgba(128, 201, 106, 0.1)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: 'var(--primary-green)' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: showLegend } }, scales: { y: { beginAtZero: false, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 }, maxRotation: 0, minRotation: 0, callback: function (value, index) { if (labels.length > 15 && index % 3 !== 0) return ''; return this.getLabelForValue(value); } } } } }
    });
}

// Chart.js 渲染雷達圖
function renderRadarChart(canvas, labels, data, label) {
    const chartId = canvas.id;
    if (chartInstances[chartId]) chartInstances[chartId].destroy();
    chartInstances[chartId] = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: { labels, datasets: [{ label, data, backgroundColor: 'rgba(128, 201, 106, 0.2)', borderColor: 'var(--primary-green)', pointBackgroundColor: 'var(--primary-green)', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: 'var(--primary-green)' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100, pointLabels: { font: { size: 12 } }, ticks: { display: false } } } }
    });
}

// 渲染食譜卡片
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');
    if (!grid) return;
    grid.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" onclick="showRecipeDetail(${recipe.id})" data-name="${recipe.name.toLowerCase()}" data-ingredients="${recipe.ingredients.map(i => i.name).join(',').toLowerCase()}">
            <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
            <div class="card-content">
                <h3>${recipe.name}</h3>
                <p>${recipe.description}</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-clock"></i> ${recipe.cookTime}</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
            </div>
        </div>`).join('');
}

// *** 修正 ***
// 顯示蔬菜詳細頁面 (已更新為符合優化後 CSS 的 class 名稱)
function showVegetableDetail(id) {
    const vegetable = vegetables.find(v => v.id === id);
    if (!vegetable) return;
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    // 移除舊的詳細頁面（如果存在）
    document.getElementById('detailPage')?.remove();

    let detailSection = document.createElement('section');
    detailSection.id = 'detailPage'; // 使用通用ID
    detailSection.className = 'content-section active';
    document.querySelector('.main-content').appendChild(detailSection);

    const relatedRecipes = recipes.filter(r => r.ingredients.some(i => i.name.includes(vegetable.name) || vegetable.name.includes(i.name))).slice(0, 3);

    detailSection.innerHTML = `
        <div class="detail-container">
            <div class="back-button-container">
                <button class="btn btn-primary" onclick="goBackToOverview()"><i class="fas fa-arrow-left"></i> 返回蔬菜總覽</button>
            </div>
            <header class="detail-header">
                <img src="${vegetable.image}" alt="${vegetable.name}" class="detail-header-image">
                <div class="detail-header-info">
                    <h1>${vegetable.name}</h1>
                    <p class="description">${vegetable.description}</p>
                    <div class="tags">
                        <span class="tag">${vegetable.season}盛產</span>
                        <span class="tag price-change-tag ${vegetable.priceChange.includes('+') ? 'increase' : 'decrease'}">
                            ${vegetable.priceChange}
                        </span>
                    </div>
                    <div class="current-price">目前價格：NT$ ${vegetable.currentPrice} / 斤</div>
                </div>
            </header>
            
            <div class="charts-container">
                <div class="chart-card">
                    <h3><i class="fas fa-chart-line"></i> 價格趨勢</h3>
                    <div class="time-select">
                       <button onclick="updatePriceChart(event, 'detail-priceChart', ${vegetable.id}, 7, this)">近7天</button>
                       <button onclick="updatePriceChart(event, 'detail-priceChart', ${vegetable.id}, 14, this)">近14天</button>
                       <button class="active" onclick="updatePriceChart(event, 'detail-priceChart', ${vegetable.id}, 30, this)">近30天</button>
                    </div>
                    <div class="chart-wrapper"><canvas id="detail-priceChart"></canvas></div>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-chart-pie"></i> 營養佔比</h3>
                    <div class="chart-wrapper"><canvas id="detail-nutritionChart"></canvas></div>
                </div>
            </div>

            <section class="detail-section">
                <h3><i class="fas fa-balance-scale"></i> 營養價值 (每100g)</h3>
                <div class="nutrition-grid">
                    ${Object.entries(vegetable.nutrition).map(([key, val]) => `
                        <div class="nutrition-item">
                            <div class="value">${val}${key === '纖維' ? 'g' : (key === '熱量' ? '卡' : (key.includes('維生素') ? 'μg' : 'mg'))}</div>
                            <small>${key}</small>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section class="detail-section related-recipes">
                <h3><i class="fas fa-utensils"></i> 相關食譜推薦</h3>
                ${relatedRecipes.length > 0 ? `
                    <div class="recipes-grid">
                        ${relatedRecipes.map(recipe => `
                            <div class="recipe-card" onclick="showRecipeDetail(${recipe.id})">
                                <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
                                <div class="card-content">
                                    <h4>${recipe.name}</h4>
                                    <p><strong>主要食材：</strong>${recipe.ingredients.slice(0, 3).map(ing => ing.name).join('、')}</p>
                                    <div class="recipe-meta">
                                        <span><i class="fas fa-clock"></i> ${recipe.cookTime}</span>
                                        <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                                    </div>
                                </div>
                            </div>`).join('')}
                    </div>` :
            `<p>暫無相關 ${vegetable.name} 食譜</p>`
        }
            </section>
        </div>`;

    setTimeout(() => {
        updatePriceChart(null, `detail-priceChart`, vegetable.id, 30);
        const nutritionCanvas = document.getElementById(`detail-nutritionChart`);
        if (nutritionCanvas) {
            const nut = vegetable.nutrition;
            const labels = Object.keys(nut);
            const data = Object.values(nut).map((value, index) => {
                const maxValues = [50, 5, 100, 500, 3, 150];
                return (value / maxValues[index]) * 100;
            });
            renderRadarChart(nutritionCanvas, labels, data, '營養價值(%)');
        }
    }, 100);
    if (window.innerWidth <= 768) sidebar.classList.remove('active');
}

// *** 修正 ***
// 顯示食譜詳細頁面 (已更新為符合優化後 CSS 的 class 名稱)
function showRecipeDetail(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    // 移除舊的詳細頁面（如果存在）
    document.getElementById('detailPage')?.remove();

    let detailSection = document.createElement('section');
    detailSection.id = 'detailPage'; // 使用通用ID
    detailSection.className = 'content-section active';
    document.querySelector('.main-content').appendChild(detailSection);

    const relatedRecipes = recipes.filter(r => r.id !== recipe.id && r.ingredients.some(ing => recipe.ingredients.some(rIng => ing.name.includes(rIng.name) || rIng.name.includes(ing.name)))).slice(0, 3);

    detailSection.innerHTML = `
        <div class="detail-container">
            <div class="back-button-container">
                <button class="btn btn-primary" onclick="goBackToRecipes()"><i class="fas fa-arrow-left"></i> 返回食譜列表</button>
            </div>
            <header class="detail-header recipe-header">
                <img src="${recipe.image}" alt="${recipe.name}" class="detail-header-image">
                <div class="detail-header-info">
                    <h1>${recipe.name}</h1>
                    <p class="description">${recipe.description}</p>
                    <div class="recipe-header-meta">
                        <div class="meta-item"><i class="fas fa-clock"></i><span>${recipe.cookTime}</span></div>
                        <div class="meta-item"><i class="fas fa-signal"></i><span>${recipe.difficulty}</span></div>
                        <div class="meta-item"><i class="fas fa-users"></i><span>${recipe.servings}</span></div>
                    </div>
                </div>
            </header>

            <section class="detail-section">
                <h3><i class="fas fa-list-ul"></i> 所需食材</h3>
                <div class="ingredients-grid">
                    ${recipe.ingredients.map(ing => `
                        <div class="ingredient-item">
                            <span class="name">${ing.name}</span>
                            <span class="amount">${ing.amount}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <section class="detail-section">
                <h3><i class="fas fa-shoe-prints"></i> 烹飪步驟</h3>
                <div class="steps-container">
                    ${recipe.steps.map(step => `
                        <div class="step-item">
                            <div class="step-number">${step.step}</div>
                            <div class="step-content">
                                <img src="${step.image}" alt="步驟 ${step.step}" class="step-image">
                                <p class="description">${step.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="detail-section">
                <h3><i class="fas fa-lightbulb"></i> 烹飪小貼士</h3>
                <p>• 選用新鮮食材，確保最佳口感和營養價值。</p>
                <p>• 調味料可依個人喜好調整，建議先少後多。</p>
                <p>• 注意火候控制，避免過度烹煮影響口感。</p>
            </section>
            
            ${relatedRecipes.length > 0 ? `
            <section class="detail-section related-recipes">
                <h3><i class="fas fa-thumbs-up"></i> 更多推薦</h3>
                <div class="recipes-grid">
                    ${relatedRecipes.map(r => `
                        <div class="recipe-card" onclick="showRecipeDetail(${r.id})">
                            <img src="${r.image}" alt="${r.name}" loading="lazy">
                            <div class="card-content">
                                <h4>${r.name}</h4>
                                <p><strong>主要食材：</strong>${r.ingredients.slice(0, 3).map(i => i.name).join('、')}</p>
                                <div class="recipe-meta">
                                    <span><i class="fas fa-clock"></i> ${r.cookTime}</span>
                                    <span><i class="fas fa-signal"></i> ${r.difficulty}</span>
                                </div>
                            </div>
                        </div>`).join('')}
                </div>
            </section>` : ''}
        </div>`;
    if (window.innerWidth <= 768) sidebar.classList.remove('active');
}

// 返回函式
function goBackToOverview() {
    const detailSection = document.getElementById('detailPage');
    if (detailSection) detailSection.remove();
    document.getElementById('overview').classList.add('active');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="overview"]').classList.add('active');
}
function goBackToRecipes() {
    const detailSection = document.getElementById('detailPage');
    if (detailSection) detailSection.remove();
    document.getElementById('recipe').classList.add('active');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="recipe"]').classList.add('active');
}

// 統一設置所有事件監聽器
function setupEventListeners() {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetSectionId = this.getAttribute('data-section');
            document.getElementById('detailPage')?.remove(); // 確保動態頁面被移除
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetSectionId).classList.add('active');
            if (window.innerWidth <= 768) sidebar.classList.remove('active');
        });
    });
    chatToggle.addEventListener('click', (e) => {
        e.preventDefault();
        chatBody.classList.toggle('active');
        chatToggle.querySelector('i').classList.toggle('fa-angle-up');
        chatToggle.querySelector('i').classList.toggle('fa-angle-down');
    });
    sendMessage.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', e => e.key === 'Enter' && sendChatMessage());

    // 搜尋功能
    document.getElementById('vegetableSearch').addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#vegetableGrid .vegetable-card').forEach(card => {
            card.style.display = card.dataset.name.includes(term) ? 'flex' : 'none';
        });
    });
    document.getElementById('recipeSearch').addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#recipeGrid .recipe-card').forEach(card => {
            const nameMatch = card.dataset.name.includes(term);
            const ingredientMatch = card.dataset.ingredients.includes(term);
            card.style.display = (nameMatch || ingredientMatch) ? 'flex' : 'none';
        });
    });
    document.getElementById('priceSearch').addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#priceResults .price-card').forEach(card => {
            card.style.display = card.dataset.name.includes(term) ? 'flex' : 'none';
        });
    });
}

// 聊天功能
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    chatInput.value = '';
    setTimeout(() => addMessage(generateAIResponse(message), 'bot'), 1000);
}
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<i class="fas ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i><span>${text}</span>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
function generateAIResponse(message) {
    const responses = { '大白菜': '大白菜是十字花科蔬菜，富含維生素C和纖維，適合炒、煮、滷等多種烹調方式。', '營養': '想查詢哪種蔬菜的營養呢？例如：番茄營養。', '食譜': '請告訴我您想用什麼食材來找食譜？', '價格': '蔬菜價格會受季節、天氣和市場供需影響，您可以參考我們的價格預測頁面。' };
    for (let key in responses) { if (message.includes(key)) return responses[key]; }
    return '感謝您的提問，我會持續學習以提供更好的幫助。您可以試著問我「空心菜食譜」或「黃瓜價格」。';
}