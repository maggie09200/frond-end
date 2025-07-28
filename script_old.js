// 全域變數儲存資料
let vegetables = [];
let recipes = [];
let vegNameMapping = {};

// 蔬菜篩選功能
let currentFilter = 'all';

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
            if (index === 0 || !line.trim()) return; // 跳過標題行和空行
            const [chinese, english] = line.split(',');
            if (chinese && english) {
                vegNameMapping[chinese.trim()] = english.trim();
            }
        });

        generateVegetablesData();
    } catch (error) {
        console.error('載入蔬菜名稱對照表失敗:', error);
        // 使用預設資料
        generateVegetablesData();
    }
}

// 讀取食譜資料
async function loadRecipesData() {
    try {
        const response = await fetch('大白菜_清理後食譜.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n');

        recipes = [];
        lines.forEach((line, index) => {
            if (index === 0 || !line.trim()) return; // 跳過標題行和空行

            const columns = parseCSVLine(line);
            if (columns.length >= 7) {
                const [id, name, url, preview_ingredients, ingredients, steps, combined_text, image_path] = columns;

                // 解析食材
                const ingredientsList = ingredients.split('|').map(item => {
                    const parts = item.trim().split(' ');
                    return {
                        name: parts[0],
                        amount: parts.slice(1).join(' ') || '適量',
                        note: ''
                    };
                });

                // 解析步驟
                const stepsList = steps.split('|').map((step, stepIndex) => ({
                    step: stepIndex + 1,
                    description: step.trim(),
                    image: `https://images.unsplash.com/photo-${1500000000000 + parseInt(id)}?w=400`
                }));

                recipes.push({
                    id: parseInt(id),
                    name: name,
                    image: `https://images.unsplash.com/photo-${1500000000000 + parseInt(id)}?w=300`,
                    ingredients: ingredientsList,
                    description: preview_ingredients.substring(0, 50) + '...',
                    cookTime: '30分鐘',
                    difficulty: '簡單',
                    servings: '2-3人份',
                    steps: stepsList
                });
            }
        });

        renderRecipes();
    } catch (error) {
        console.error('載入食譜資料失敗:', error);
    }
}

// 解析CSV行（處理逗號分隔）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// 生成蔬菜資料
function generateVegetablesData() {
    const vegNames = Object.keys(vegNameMapping);
    const seasons = ['春季', '夏季', '秋季', '冬季', '四季'];

    vegetables = vegNames.map((name, index) => {
        const basePrice = 20 + Math.random() * 40;
        const priceChange = (Math.random() - 0.5) * 30;
        const currentPrice = Math.round(basePrice + priceChange);
        const changePercent = ((priceChange / basePrice) * 100).toFixed(1);

        return {
            id: index + 1,
            name: name,
            image: `images/${name}.jpg`,
            description: `新鮮${name}，營養豐富`,
            nutrition: {
                calories: Math.round(15 + Math.random() * 35),
                fiber: Math.round((1 + Math.random() * 4) * 10) / 10,
                vitaminC: Math.round(10 + Math.random() * 90),
                vitaminA: Math.round(Math.random() * 500),
                iron: Math.round((0.3 + Math.random() * 2.7) * 10) / 10,
                calcium: Math.round(10 + Math.random() * 140)
            },
            priceHistory: Array.from({ length: 10 }, () => Math.round(basePrice + (Math.random() - 0.5) * 10)),
            currentPrice: currentPrice,
            priceChange: `${changePercent >= 0 ? '+' : ''}${changePercent}%`,
            season: seasons[Math.floor(Math.random() * seasons.length)],
            relatedRecipes: []
        };
    });

    renderVegetables();
}

// 渲染蔬菜卡片（加入篩選功能）
function renderVegetables(filter = 'all') {
    const grid = document.getElementById('vegetableGrid');
    if (!grid) return;

    let filteredVegetables = vegetables;

    switch (filter) {
        case 'seasonal':
            const currentSeason = getCurrentSeason();
            filteredVegetables = vegetables.filter(veg => veg.season === currentSeason || veg.season === '四季');
            break;
        case 'rising':
            filteredVegetables = vegetables.filter(veg => veg.priceChange.includes('+'));
            break;
        case 'falling':
            filteredVegetables = vegetables.filter(veg => veg.priceChange.includes('-'));
            break;
        default:
            filteredVegetables = vegetables;
    }

    grid.innerHTML = filteredVegetables.map(veg => `
        <div class="vegetable-card" onclick="showVegetableDetail(${veg.id})">
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

// 獲取當前季節
function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return '春季';
    if (month >= 6 && month <= 8) return '夏季';
    if (month >= 9 && month <= 11) return '秋季';
    return '冬季';
}

// 篩選按鈕事件
function filterVegetables(filter) {
    currentFilter = filter;
    renderVegetables(filter);

    // 更新按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="filterVegetables('${filter}')"]`).classList.add('active');
}

// 渲染食譜卡片
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');
    if (!grid) return;

    grid.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" onclick="showRecipeDetail(${recipe.id})">
            <img src="${recipe.image}" alt="${recipe.name}" loading="lazy">
            <div class="card-content">
                <h3>${recipe.name}</h3>
                <p><strong>主要食材：</strong>${recipe.ingredients.slice(0, 3).map(ing => ing.name).join('、')}</p>
                <p>${recipe.description}</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-clock"></i> ${recipe.cookTime}</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 顯示蔬菜詳細資訊
function showVegetableDetail(id) {
    const vegetable = vegetables.find(v => v.id === id);
    if (!vegetable) return;

    // 隱藏所有內容區塊
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));

    // 更新導航狀態
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));

    // 創建或更新蔬菜詳細頁面
    let detailSection = document.getElementById('vegetableDetail');
    if (!detailSection) {
        detailSection = document.createElement('section');
        detailSection.id = 'vegetableDetail';
        detailSection.className = 'content-section';
        document.querySelector('.main-content').appendChild(detailSection);
    }

    // 找出相關食譜（包含該蔬菜的食譜）
    const relatedRecipes = recipes.filter(recipe =>
        recipe.ingredients.some(ingredient =>
            ingredient.name.includes(vegetable.name) ||
            vegetable.name.includes(ingredient.name)
        )
    ).slice(0, 6); // 顯示更多相關食譜

    detailSection.innerHTML = `
        <div class="vegetable-detail-container">
            <!-- 返回按鈕 -->
            <div class="back-button-container">
                <button class="back-button" onclick="goBackToOverview()">
                    <i class="fas fa-arrow-left"></i> 返回蔬菜總覽
                </button>
            </div>
            
            <!-- 蔬菜基本資訊 -->
            <div class="vegetable-header">
                <div class="vegetable-image">
                    <img src="${vegetable.image}" alt="${vegetable.name}">
                </div>
                <div class="vegetable-info">
                    <h1>${vegetable.name}</h1>
                    <p class="description">${vegetable.description}</p>
                    <div class="tags">
                        <span class="season-tag">${vegetable.season}盛產</span>
                        <span class="price-change-tag ${vegetable.priceChange.includes('+') ? 'increase' : 'decrease'}">
                            ${vegetable.priceChange}
                        </span>
                    </div>
                    <div class="current-price">
                        目前價格：NT$ ${vegetable.currentPrice} / 斤
                    </div>
                </div>
            </div>

            <!-- 圖表區域 -->
            <div class="charts-container">
                <!-- 價格預測圖表 -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-line"></i> 價格趨勢預測</h3>
                    <div class="chart-wrapper">
                        <canvas id="priceChart-${vegetable.id}"></canvas>
                    </div>
                </div>

                <!-- 營養價值雷達圖 -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-area"></i> 營養價值分析</h3>
                    <div class="chart-wrapper">
                        <canvas id="nutritionChart-${vegetable.id}"></canvas>
                    </div>
                </div>
            </div>

            <!-- 營養價值詳細資訊 -->
            <div class="nutrition-details">
                <h3>營養價值 (每100g)</h3>
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.calories}</div>
                        <small>大卡</small>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.fiber}g</div>
                        <small>纖維</small>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.vitaminC}mg</div>
                        <small>維生素C</small>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.vitaminA}μg</div>
                        <small>維生素A</small>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.iron}mg</div>
                        <small>鐵質</small>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${vegetable.nutrition.calcium}mg</div>
                        <small>鈣質</small>
                    </div>
                </div>
            </div>

            <!-- 推薦食譜 -->
            <div class="related-recipes">
                <h3><i class="fas fa-utensils"></i> 推薦食譜</h3>
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
                        </div>
                    `).join('')}
                </div>
                ` : `
                <div class="no-recipes">
                    <p><i class="fas fa-info-circle"></i> 暫時沒有找到相關的${vegetable.name}食譜，請稍後再來查看！</p>
                </div>
                `}
            </div>
        </div>
    `;

    detailSection.classList.add('active');

    // 等待DOM更新後繪製圖表
    setTimeout(() => {
        drawPriceChart(vegetable);
        drawNutritionChart(vegetable);
    }, 100);

    // 手機版關閉選單
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// 繪製價格趨勢圖表
function drawPriceChart(vegetable) {
    const canvas = document.getElementById(`priceChart-${vegetable.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    // 設定樣式
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(39, 174, 96, 0.1)';

    // 準備數據
    const prices = vegetable.priceHistory;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // 計算點位
    const points = prices.map((price, index) => ({
        x: (index / (prices.length - 1)) * (width - 60) + 30,
        y: height - 50 - ((price - minPrice) / priceRange) * (height - 100)
    }));

    // 繪製網格線
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = 50 + (i / 5) * (height - 100);
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();
    }

    // 繪製折線
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();

    // 繪製填充區域
    ctx.fillStyle = 'rgba(39, 174, 96, 0.1)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - 50);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - 50);
    ctx.closePath();
    ctx.fill();

    // 繪製數據點
    ctx.fillStyle = '#27ae60';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 添加標籤
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('價格趨勢 (近10日)', width / 2, 20);

    // Y軸標籤
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = minPrice + (maxPrice - minPrice) * (1 - i / 5);
        const y = 50 + (i / 5) * (height - 100);
        ctx.fillText(`NT$${Math.round(value)}`, 25, y + 4);
    }
}

// 繪製營養價值雷達圖
function drawNutritionChart(vegetable) {
    const canvas = document.getElementById(`nutritionChart-${vegetable.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;

    // 營養數據
    const nutritionData = [
        { label: '熱量', value: vegetable.nutrition.calories, max: 50 },
        { label: '纖維', value: vegetable.nutrition.fiber, max: 5 },
        { label: '維生素C', value: vegetable.nutrition.vitaminC, max: 100 },
        { label: '維生素A', value: vegetable.nutrition.vitaminA, max: 500 },
        { label: '鐵質', value: vegetable.nutrition.iron, max: 3 },
        { label: '鈣質', value: vegetable.nutrition.calcium, max: 150 }
    ];

    const angleStep = (Math.PI * 2) / nutritionData.length;

    // 繪製背景網格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        const r = (radius * i) / 5;
        ctx.beginPath();
        for (let j = 0; j < nutritionData.length; j++) {
            const angle = j * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // 繪製軸線
    nutritionData.forEach((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius
        );
        ctx.stroke();
    });

    // 繪製數據區域
    ctx.fillStyle = 'rgba(39, 174, 96, 0.3)';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    nutritionData.forEach((data, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = Math.min(data.value / data.max, 1);
        const x = centerX + Math.cos(angle) * radius * value;
        const y = centerY + Math.sin(angle) * radius * value;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 添加標籤
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    nutritionData.forEach((data, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        ctx.fillText(data.label, x, y + 4);
    });
}

// 顯示食譜詳細資訊
function showRecipeDetail(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    // 隱藏所有內容區塊
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));

    // 更新導航狀態
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));

    // 創建或更新食譜詳細頁面
    let detailSection = document.getElementById('recipeDetail');
    if (!detailSection) {
        detailSection = document.createElement('section');
        detailSection.id = 'recipeDetail';
        detailSection.className = 'content-section';
        document.querySelector('.main-content').appendChild(detailSection);
    }

    // 找出相關食譜（相同食材的其他食譜）
    const relatedRecipes = recipes.filter(r =>
        r.id !== recipe.id &&
        r.ingredients.some(ingredient =>
            recipe.ingredients.some(recipeIng =>
                ingredient.name.includes(recipeIng.name) ||
                recipeIng.name.includes(ingredient.name)
            )
        )
    ).slice(0, 3);

    detailSection.innerHTML = `
        <div class="recipe-detail-container">
            <!-- 返回按鈕 -->
            <div class="back-button-container">
                <button class="back-button" onclick="goBackToRecipes()">
                    <i class="fas fa-arrow-left"></i> 返回食譜列表
                </button>
            </div>
            
            <!-- 食譜標題區 -->
            <div class="recipe-header">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.name}">
                </div>
                <div class="recipe-info">
                    <h1>${recipe.name}</h1>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${recipe.cookTime}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-signal"></i>
                            <span>${recipe.difficulty}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span>${recipe.servings}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 食材清單 -->
            <div class="ingredients-section">
                <h3><i class="fas fa-list"></i> 所需食材</h3>
                <div class="ingredients-grid">
                    ${recipe.ingredients.map(ingredient => `
                        <div class="ingredient-item">
                            <span class="ingredient-name">${ingredient.name}</span>
                            <span class="ingredient-amount">${ingredient.amount}</span>
                            ${ingredient.note ? `<small class="ingredient-note">${ingredient.note}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 烹飪步驟 -->
            <div class="steps-section">
                <h3><i class="fas fa-utensils"></i> 烹飪步驟</h3>
                <div class="steps-container">
                    ${recipe.steps.map(step => `
                        <div class="step-item">
                            <div class="step-number">${step.step}</div>
                            <div class="step-content">
                                <img src="${step.image}" alt="步驟${step.step}" class="step-image">
                                <p class="step-description">${step.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 小貼士 -->
            <div class="tips-section">
                <h3><i class="fas fa-lightbulb"></i> 烹飪小貼士</h3>
                <div class="tips-content">
                    <p>• 選用新鮮食材，確保最佳口感和營養價值</p>
                    <p>• 調味料可依個人喜好調整，建議先少後多</p>
                    <p>• 注意火候控制，避免過度烹煮影響口感</p>
                </div>
            </div>

            <!-- 相關食譜推薦 -->
            ${relatedRecipes.length > 0 ? `
            <div class="related-recipes">
                <h3><i class="fas fa-utensils"></i> 相關食譜推薦</h3>
                <div class="recipes-grid">
                    ${relatedRecipes.map(relatedRecipe => `
                        <div class="recipe-card" onclick="showRecipeDetail(${relatedRecipe.id})">
                            <img src="${relatedRecipe.image}" alt="${relatedRecipe.name}" loading="lazy">
                            <div class="card-content">
                                <h4>${relatedRecipe.name}</h4>
                                <p><strong>主要食材：</strong>${relatedRecipe.ingredients.slice(0, 3).map(ing => ing.name).join('、')}</p>
                                <div class="recipe-meta">
                                    <span><i class="fas fa-clock"></i> ${relatedRecipe.cookTime}</span>
                                    <span><i class="fas fa-signal"></i> ${relatedRecipe.difficulty}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    detailSection.classList.add('active');

    // 手機版關閉選單
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// 返回蔬菜總覽
function goBackToOverview() {
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));

    document.getElementById('overview').classList.add('active');

    // 更新導航狀態
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="overview"]').classList.add('active');
}

// 返回食譜列表
function goBackToRecipes() {
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => section.classList.remove('active'));

    document.getElementById('recipe').classList.add('active');

    // 更新導航狀態
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="recipe"]').classList.add('active');
}

// 設置事件監聽器
function setupEventListeners() {
    // 選單切換
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });

    // 導航項目點擊
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');

            // 更新導航狀態
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // 顯示對應內容區塊
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');

            // 手機版關閉選單
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // 聊天功能
    chatToggle.addEventListener('click', function () {
        chatBody.classList.toggle('active');
        const icon = this.querySelector('.fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
    });

    sendMessage.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // AI 助手頁面聊天功能
    const aiSendButton = document.getElementById('aiSendMessage');
    const aiChatInput = document.getElementById('aiChatInput');

    if (aiSendButton) {
        aiSendButton.addEventListener('click', sendAIChatMessage);
    }

    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendAIChatMessage();
            }
        });
    }

    // 蔬菜搜尋功能
    const vegetableSearchInput = document.getElementById('vegetableSearch');
    if (vegetableSearchInput) {
        vegetableSearchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.vegetable-card');

            cards.forEach(card => {
                const name = card.querySelector('h3').textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 食譜搜尋功能
    const recipeSearchInput = document.getElementById('recipeSearch');
    if (recipeSearchInput) {
        recipeSearchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.recipe-card');

            cards.forEach(card => {
                const name = card.querySelector('h3').textContent.toLowerCase();
                const ingredients = card.querySelector('p').textContent.toLowerCase();
                if (name.includes(searchTerm) || ingredients.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 營養搜尋功能
    setupNutritionSearch();
}

// 右下角聊天功能
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    chatInput.value = '';

    // 模擬AI回應
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'bot');
    }, 1000);
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `
        <i class="fas ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i>
        <span>${text}</span>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// AI助手頁面聊天功能
function sendAIChatMessage() {
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatMessages = document.getElementById('aiChatMessages');
    const message = aiChatInput.value.trim();
    if (!message) return;

    addAIMessage(message, 'user');
    aiChatInput.value = '';

    // 模擬AI回應
    setTimeout(() => {
        const response = generateAIResponse(message);
        addAIMessage(response, 'bot');
    }, 1000);
}

function addAIMessage(text, sender) {
    const aiChatMessages = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `
        <i class="fas ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i>
        <span>${text}</span>
    `;
    aiChatMessages.appendChild(messageDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

function generateAIResponse(message) {
    const responses = {
        '大白菜': '大白菜是十字花科蔬菜，富含維生素C和纖維質。我們有多種大白菜料理食譜可以參考！',
        '營養': '蔬菜是維生素、礦物質和纖維的重要來源。建議每日攝取3-5份不同顏色的蔬菜。',
        '食譜': '我可以根據您現有的食材推薦適合的食譜。請告訴我您有哪些食材？',
        '價格': '蔬菜價格會受季節、天氣和產量影響。建議選擇當季蔬菜，價格較為實惠。'
    };

    for (let key in responses) {
        if (message.includes(key)) {
            return responses[key];
        }
    }

    return '感謝您的提問！我會持續學習更多蔬菜知識來幫助您。有其他問題歡迎隨時詢問！';
}






