// --------- Конфигурация игры ---------
const GAME_CONFIG = {
    startMoney: 90000,
    startParts: { battery: 5, motherboard: 5, cpu: 5, gpu: 5, case: 5, ram: 5 },
    partCost: { battery: 10, motherboard: 50, cpu: 40, gpu: 100, case: 25, ram: 20 },
    upgradeCost: 100,
    supplyUpgradeCost: 10000,
    supplyInterval: 35000,
    supplyAmount: { battery: 2, motherboard: 1, cpu: 1, gpu: 1, case: 1, ram: 2 },
    employeeSpeedIncrease: 0.5,
    orderInterval: 3000,
    employeeSpeedIncrementEvery: 5,
    maxOrders: 8,
    orderIncreaseCost: 5000,
    employeeMaxSpeed: 10,
    EMPLOYEE_AVATARS: ['👨‍🔧','👩‍🔧','👨‍🔬','👩‍🔬','🧑‍💻','👨‍🏭']
};

// --------- Игровое состояние ---------
let gameState = {
    money: GAME_CONFIG.startMoney,
    parts: {...GAME_CONFIG.startParts},
    employees: [],
    orders: [],
    lastOrderTime: Date.now(),
    orderCount: 0,
    totalOrdersCompleted: 0,
    currentShopTab: 'parts',
    supplyActive: false
};

// --------- DOM элементы ---------
const moneyElement = document.getElementById('money');
const partsElement = document.getElementById('parts');
const employeeListElement = document.getElementById('employeeList');
const orderListElement = document.getElementById('orderList');
const shopPartsBtn = document.getElementById('shopPartsBtn');
const shopEmployeesBtn = document.getElementById('shopEmployeesBtn');
const shopUpgradesBtn = document.getElementById('shopUpgradesBtn');
const shopContentElement = document.getElementById('shopContent');

// --------- Иконки деталей ---------
const PART_ICONS = { battery:'🔋', motherboard:'💻', cpu:'🖥️', gpu:'🎮', case:'🖱️', ram:'📀' };

// --------- UI: сотрудники и заказы ---------
function renderEmployees() {
    const list = document.getElementById("employeeList");
    list.innerHTML = "";

    gameState.employees.forEach(emp => {
        const card = document.createElement("div");
        card.className = "employee-card p-3 border rounded-lg flex flex-col items-center";

        // Содержание карточки
        card.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="text-4xl mb-2">${emp.avatar}</div>
                <h3 class="font-bold text-lg">Сотрудник</h3>
                <p class="text-sm text-gray-500">Выполнил: ${emp.ordersCompleted}</p>
            </div>
            <div class="mt-3 w-full text-left">
                <h4 class="font-semibold text-sm mb-1">🎁 Перки:</h4>
                <ul class="text-xs text-gray-700 space-y-1">
                    ${emp.perks.speedBonus      ? `<li>⚡ +${Math.round(emp.perks.speedBonus*100)}% скорость</li>` : ""}
                    ${emp.perks.savePartChance  ? `<li>🔧 ${Math.round(emp.perks.savePartChance*100)}% шанс сэкономить деталь</li>` : ""}
                    ${emp.perks.breakPartChance ? `<li>💥 ${Math.round(emp.perks.breakPartChance*100)}% шанс сломать деталь</li>` : ""}
                    ${emp.perks.bonusReward     ? `<li>💰 +${Math.round(emp.perks.bonusReward*100)}% награда</li>` : ""}
                    ${emp.perks.expBoost        ? `<li>📚 +${Math.round(emp.perks.expBoost*100)}% опыт</li>` : ""}
                </ul>
            </div>
        `;

        // Drag & Drop
        card.draggable = !emp.isBusy;
        card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', emp.id));

        list.appendChild(card);
    });
}

function renderOrders() {
    orderListElement.innerHTML = '';
    gameState.orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card p-2 border rounded mb-2';
        card.dataset.orderId = order.id;

        if(order.rare) {
            card.style.border = '2px solid gold';
        }

        let partsText = "—";
        if (order.partsRequired) {
            partsText = Object.entries(order.partsRequired)
                .map(([p, qty]) => `${PART_ICONS[p] || p} x${qty}`).join(' ');
        }

        card.innerHTML = `
            <div class="font-semibold">Заказ #${order.id}</div>
            <div>Техника: ${order.type}</div>
            <div style="font-style:italic; color:#555; margin:2px 0;">
                Записка клиента: «${order.note}»
            </div>
            <div>Награда: 💰${order.reward}</div>
            <div>Нужно деталей: ${partsText}</div>
            <div class="progress-bar-container" style="width:100%; background:#ccc; border-radius:4px;">
                <div class="progress-bar" style="width:${100 - (order.timeRemaining / order.initialTime) * 100}%;
                    background-color:#10b981;height:8px;border-radius:4px;"></div>
            </div>
            <div class="order-employee" style="margin-top:4px; color:${order.employeeId ? '#10b981' : '#999'}">
                ${order.employeeId ? `В работе: ${gameState.employees.find(e => e.id === order.employeeId)?.avatar}` : 'Свободен'}
            </div>
        `;
        orderListElement.appendChild(card);
    });

    setupOrderDragAndDrop();
}
function updateUI(){
    moneyElement.textContent = gameState.money;
    partsElement.textContent = Object.entries(gameState.parts)
        .map(([key,val])=>`${PART_ICONS[key]} ${val}`).join('  ');

    gameState.employees.forEach(emp=>{
        const card = document.querySelector(`.employee-card[data-emp-id="${emp.id}"]`);
        if(card){
            card.querySelector('.employee-speed').textContent = `Скорость: ${emp.speed.toFixed(2)}`;
            card.querySelector('.employee-status').textContent = emp.isBusy ? '🛠 Выполняет заказ' : '✅ Свободен';
            card.draggable = !emp.isBusy;
        }
    });

    gameState.orders.forEach(order=>{
        const card = document.querySelector(`.order-card[data-order-id="${order.id}"]`);
        if(card){
            const progress = Math.min(100, 100-(order.timeRemaining/order.initialTime)*100);
            card.querySelector('.progress-bar').style.width = progress + '%';
            card.querySelector('.order-employee').textContent = order.employeeId
                ? `В работе: ${gameState.employees.find(e=>e.id===order.employeeId)?.avatar}`
                : 'Свободен';
        }
    });
}

// --------- Drag & Drop сотрудников на заказы ---------
function setupOrderDragAndDrop(){
    document.querySelectorAll('.order-card').forEach(card=>{
        card.addEventListener('dragover', e=>{
            e.preventDefault(); 
            card.classList.add('drag-over');
        });
        card.addEventListener('dragleave', e=>{
            card.classList.remove('drag-over');
        });
        card.addEventListener('drop', e=>{
            e.preventDefault();
            card.classList.remove('drag-over');
            const empId = e.dataTransfer.getData('text/plain');
            assignEmployeeToOrder(empId, parseInt(card.dataset.orderId));
        });
    });
}

// --------- Заказы ---------
const CLIENT_NOTES_BY_TYPE = {
    "Телефон": [
        "Уронил в воду, теперь только пузыри идут...",
        "Случайно перепутал с орехоколом 🍎🥜",
        "Разобрал, чтобы посмотреть, где живут смс — не собрал обратно",
        "Играл в змейку, и он сгорел 🔥",
        "Заряжал через микроволновку — не заряжается 🤷"
    ],
    "Ноутбук": [
        "Кот решил, что ноутбук — это лоток 🐈",
        "Закрыл крышку, забыв про бутерброд внутри 🥪",
        "Сидел на нём во время пар, теперь экран хрустит",
        "Играл в Dark Souls, ноут не выдержал психической нагрузки",
        "Пытался починить сам — теперь у него 3 клавиатуры"
    ],
    "ПК": [
        "Подключил к розетке через вилку от чайника 🍵",
        "Думал, что блок питания — это обогреватель",
        "Поставил вместо кулера вентилятор из Икеи",
        "Пылесосил системник, засосало видеокарту 🌀",
        "Запустил тест на прочность молотком 🔨"
    ],
    "Сервер": [
        "Сервер работал, пока не обновил Windows...",
        "В серверной устроил вечеринку, теперь всё мигает как дискотека",
        "Подключил к кофемашине ради эксперимента ☕",
        "Использовал сервер как тумбочку для аквариума 🐠",
        "Слишком громко шумел — решил залить монтажной пеной"
    ],
    "Суперкомпьютер": [
        "Хотел майнить биткоин, но случайно сжёг вселенную 🔥",
        "Перепутал с орбитальной пушкой — теперь соседи жалуются",
        "Запустил Doom, а он запустил Doom на холодильнике",
        "Решил проверить, выдержит ли он чайник — не выдержал",
        "Сосед подумал, что это шкаф, и повесил туда вещи"
    ],
    "Планшет": [
        "Ребёнок нарисовал стилусом по экрану — стилус был отвёрткой 🔧",
        "Хотел согнуть как газету — сломался 📖",
        "Пытался поджарить тосты на нём, не вышло 🍞"
    ],
    "Игровая консоль": [
        "Кинул джойстик в телевизор, теперь не работает ни консоль, ни телек 📺",
        "Играл 72 часа подряд, консоль решила уйти в отпуск",
        "Налил энергетик в дисковод для ускорения ⚡"
    ],
    "Холодильник с Wi-Fi": [
        "Пытался скачать обновление прямо в морозилку ❄️",
        "Сосед подключился к Wi-Fi и заблокировал дверь 🚪",
        "Поставил внутрь роутер — теперь ловит хуже"
    ]
};

const ORDER_TEMPLATES = [
    { type: 'Телефон', minCompleted: 0, baseParts: { battery:1, cpu:1, ram:1 }, baseTime: 100, baseReward: 25 },
    { type: 'Ноутбук', minCompleted: 5, baseParts: { battery:2, cpu:1, ram:2, motherboard:1 }, baseTime: 150, baseReward: 50 },
    { type: 'ПК', minCompleted: 15, baseParts: { cpu:1, gpu:1, ram:2, motherboard:1, case:1 }, baseTime: 200, baseReward: 75 },
    { type: 'Сервер', minCompleted: 30, baseParts: { cpu:2, ram:4, motherboard:1, case:1, gpu:2 }, baseTime: 300, baseReward: 150 },
    { type: 'Суперкомпьютер', minCompleted: 50, baseParts: { cpu:4, ram:8, motherboard:2, case:2, gpu:4, battery:5 }, baseTime: 500, baseReward: 1000, rare: true },
    { type: 'Планшет', minCompleted: 10, baseParts: { battery:1, ram:2, cpu:1 }, baseTime: 120, baseReward: 40 },
    { type: 'Игровая консоль', minCompleted: 20, baseParts: { cpu:1, gpu:1, ram:1, case:1 }, baseTime: 180, baseReward: 60 },
    { type: 'Холодильник с Wi-Fi', minCompleted: 40, baseParts: { cpu:1, ram:2, motherboard:1, case:2 }, baseTime: 400, baseReward: 200 },
];

function getRandomClientNote(type) {
    const notes = CLIENT_NOTES_BY_TYPE[type];
    if (!notes || !notes.length) return "Без комментариев";
    return notes[Math.floor(Math.random() * notes.length)];
}

function createOrder(){
    if (gameState.orders.length >= GAME_CONFIG.maxOrders) return;

    const available = ORDER_TEMPLATES.filter(o => gameState.totalOrdersCompleted >= o.minCompleted);
    if (!available.length) return;

    const rareOrders = available.filter(o => o.rare);
    const normalOrders = available.filter(o => !o.rare);

    let tpl = (rareOrders.length && Math.random() < 0.1)
        ? rareOrders[Math.floor(Math.random() * rareOrders.length)]
        : normalOrders[Math.floor(Math.random() * normalOrders.length)];

    if (!tpl) return;

    const partsRequired = {};
    for (const [part, qty] of Object.entries(tpl.baseParts)) {
        partsRequired[part] = Math.max(1, Math.round(qty * (0.8 + Math.random() * 0.4)));
    }

    let reward = Math.round(tpl.baseReward * (0.8 + Math.random() * 0.4));
    if(tpl.rare) reward = Math.round(reward * 2); // редкие заказы дают больше

    const order = {
        id: gameState.orderCount++,
        type: tpl.type,
        partsRequired,
        initialTime: tpl.baseTime,
        timeRemaining: tpl.baseTime,
        reward,
        note: getRandomClientNote(tpl.type),
        employeeId: null,
        completed: false,
        rare: tpl.rare || false
    };

    gameState.orders.push(order);
    renderOrders();
}

// --------- Назначение сотрудника ---------
function assignEmployeeToOrder(empId, orderId){
    const emp = gameState.employees.find(e=>e.id===empId);
    const order = gameState.orders.find(o=>o.id===orderId);
    if(!emp || !order) return;
    if(emp.isBusy){ showNotification('Сотрудник занят','red'); return; }
    if(order.employeeId!==null){ showNotification('Заказ уже выполняется','red'); return; }

    for(const [part,qty] of Object.entries(order.partsRequired)){
        if((gameState.parts[part]||0)<qty){ showNotification(`Недостаточно деталей: ${PART_ICONS[part]}`,'red'); return; }
    }

    // Списание деталей с перками
    for(const [part,qty] of Object.entries(order.partsRequired)){
        let actualQty = qty;
        if(emp.perks.savePartChance && Math.random()<emp.perks.savePartChance) actualQty=0;
        else if(emp.perks.breakPartChance && Math.random()<emp.perks.breakPartChance) actualQty*=2;
        gameState.parts[part] = Math.max(0,(gameState.parts[part]||0)-actualQty);
    }

    emp.isBusy = true;
    order.employeeId = emp.id;
    order.timeRemaining = order.initialTime; // <-- начинаем процесс выполнения

    updateUI();
}

// --------- Магазин ---------
function renderShop(){
    shopContentElement.innerHTML = '';
    if(gameState.currentShopTab==='parts'){
        const container = document.createElement('div'); container.className='flex flex-wrap gap-2 justify-center';
        for(const part in GAME_CONFIG.partCost){
            const partContainer = document.createElement('div'); partContainer.className='flex flex-col gap-1 items-center';
            [1,10,100].forEach(amount=>{
                const btn = document.createElement('button');
                btn.textContent=`${PART_ICONS[part]} x${amount} (💰${GAME_CONFIG.partCost[part]*amount})`;
                btn.className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-md';
                btn.disabled = gameState.money< GAME_CONFIG.partCost[part]*amount;
                btn.dataset.action='buyPart'; btn.dataset.part=part; btn.dataset.amount=amount;
                partContainer.appendChild(btn);
            });
            container.appendChild(partContainer);
        }
        shopContentElement.appendChild(container);
    } else if(gameState.currentShopTab==='employees'){
        const btn = document.createElement('button');
        btn.textContent = `Нанять сотрудника (💰100)`;
        btn.className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full';
        btn.dataset.action='hireEmployee';
        shopContentElement.appendChild(btn);
    } else if(gameState.currentShopTab==='upgrades'){
        const btn1 = document.createElement('button');
        btn1.textContent=`Ускорение сотрудников (💰${GAME_CONFIG.upgradeCost})`;
        btn1.className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full';
        btn1.dataset.action='upgradeEmployees'; shopContentElement.appendChild(btn1);

        const btn2 = document.createElement('button');
        btn2.textContent=`Регулярные поставки (💰${GAME_CONFIG.supplyUpgradeCost})`;
        btn2.className='bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-full';
        btn2.dataset.action='buySupply';
        btn2.disabled = gameState.money < GAME_CONFIG.supplyUpgradeCost || gameState.supplyActive;
        shopContentElement.appendChild(btn2);

        const btn3 = document.createElement('button');
        btn3.textContent=`Расширить лимит заказов (💰${GAME_CONFIG.orderIncreaseCost})`;
        btn3.className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full mt-2';
        btn3.dataset.action='expandOrders';
        btn3.disabled = gameState.money < GAME_CONFIG.orderIncreaseCost;
        shopContentElement.appendChild(btn3);

        const btnAutomation = document.createElement('button');
        btnAutomation.textContent = `Автоматизация сотрудника (💰5000)`;
        btnAutomation.className='bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-full mt-2';
        btnAutomation.dataset.action='buyAutomation';
        shopContentElement.appendChild(btnAutomation);
    }

    const resetBtn = document.createElement('button');
    resetBtn.textContent='Сбросить игру';
    resetBtn.className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full mt-4';
    resetBtn.dataset.action='resetGame';
    shopContentElement.appendChild(resetBtn);
}

// --------- Делегирование кликов магазина ---------
shopContentElement.addEventListener('click', e=>{
    const btn = e.target.closest('button'); if(!btn||btn.disabled) return;
    switch(btn.dataset.action){
        case 'buyPart': buyParts(btn.dataset.part,parseInt(btn.dataset.amount)); break;
        case 'hireEmployee': hireEmployee(); break;
        case 'upgradeEmployees': upgradeEmployees(); break;
        case 'buySupply': buySupply(); break;
        case 'expandOrders': expandOrders(); break;
        case 'buyAutomation': buyAutomation(); break;
        case 'resetGame': resetGame(); break;
    }
    renderShop();
});

// --------- Действия магазина ---------
function buyParts(part,amount){
    const cost = GAME_CONFIG.partCost[part]*amount;
    if(gameState.money>=cost){ gameState.money-=cost; gameState.parts[part]+=amount; updateUI(); }
    else showNotification('Недостаточно денег','red');
}

function hireEmployee() {
    const cost = 100;
    if (gameState.money >= cost) {
        gameState.money -= cost;

        const avatar = GAME_CONFIG.EMPLOYEE_AVATARS[
            Math.floor(Math.random() * GAME_CONFIG.EMPLOYEE_AVATARS.length)
        ];

        const perks = {
            speedBonus: Math.random() < 0.5 ? 0.05 : 0,     // +5% скорость
            savePartChance: Math.random() < 0.3 ? 0.3 : 0,  // 30% шанс сэкономить деталь
            breakPartChance: Math.random() < 0.1 ? 0.1 : 0, // 10% шанс сломать деталь
            bonusReward: Math.random() < 0.2 ? 0.2 : 0,     // 20% больше награда
            expBoost: Math.random() < 0.25 ? 0.5 : 0        // 50% быстрее учится
        };

        const employee = {
            id: `emp-${Date.now()}`,
            avatar,
            speed: 1,
            isBusy: false,
            ordersCompleted: 0,
            perks
        };

        gameState.employees.push(employee);

        renderEmployees();
        updateUI();
        showNotification('Нанят новый сотрудник!','green');
        saveGame();
    } else {
        showNotification('Недостаточно денег','red');
    }
}

function upgradeEmployees(){
    if(gameState.money>=GAME_CONFIG.upgradeCost){
        gameState.money-=GAME_CONFIG.upgradeCost;
        gameState.employees.forEach(e=>e.speed+=GAME_CONFIG.employeeSpeedIncrease);
        showNotification('Все сотрудники стали быстрее!','green');
        updateUI();
    } else showNotification('Недостаточно денег','red');
}

let supplyIntervalId = null;
function buySupply(){
    if(gameState.money< GAME_CONFIG.supplyUpgradeCost){ showNotification('Недостаточно денег','red'); return; }
    gameState.money -= GAME_CONFIG.supplyUpgradeCost;
    gameState.supplyActive = true;
    supplyIntervalId = setInterval(()=>{
        for(const part in GAME_CONFIG.supplyAmount) gameState.parts[part]+=GAME_CONFIG.supplyAmount[part];
        showNotification('Регулярные поставки пополнили склад!','green');
        updateUI();
    }, GAME_CONFIG.supplyInterval);
    showNotification('Регулярные поставки активированы!','green');
}

function buyAutomation(){
    if(gameState.money < 5000){
        showNotification('Недостаточно денег','red');
        return;
    }
    gameState.money -= 5000;

    // Даем автоматизацию первому свободному сотруднику
    const emp = gameState.employees.find(e => !e.autoWork);
    if(emp){
        emp.autoWork = true;
        showNotification(`${emp.avatar} теперь выполняет заказы самостоятельно!`, 'green');
    } else {
        showNotification('Все сотрудники уже автоматизированы', 'yellow');
    }

    updateUI();
}

function expandOrders(){
    if(gameState.money>=GAME_CONFIG.orderIncreaseCost){
        gameState.money -= GAME_CONFIG.orderIncreaseCost;
        GAME_CONFIG.maxOrders +=5;
        showNotification('Лимит заказов увеличен!','green');
        updateUI();
    } else showNotification('Недостаточно денег','red');
}

function resetGame(){
    if(!confirm('Сбросить игру?')) return;
    localStorage.removeItem('gameState');
    gameState.money = GAME_CONFIG.startMoney;
    gameState.parts = {...GAME_CONFIG.startParts};
    gameState.employees = [];
    gameState.orders = [];
    gameState.lastOrderTime = Date.now();
    gameState.orderCount = 0;
    const avatar = GAME_CONFIG.EMPLOYEE_AVATARS[Math.floor(Math.random()*GAME_CONFIG.EMPLOYEE_AVATARS.length)];
    gameState.employees.push({id:`emp-${Date.now()}`,avatar,speed:1,isBusy:false,ordersCompleted:0,perks:{}});
    updateUI(); renderEmployees(); renderShop();
}

function gameLoop() {
    // Создаём новые заказы
    if (Date.now() - gameState.lastOrderTime > GAME_CONFIG.orderInterval) {
        createOrder();
        gameState.lastOrderTime = Date.now();
    }

    // Автоматическое назначение сотрудников на заказы
    gameState.employees.forEach(emp => {
        if(emp.autoWork && !emp.isBusy){
            const order = gameState.orders.find(o => !o.employeeId);
            if(order) assignEmployeeToOrder(emp.id, order.id);
        }
    });

    // Выполнение заказов
    gameState.orders.forEach(order => {
        if(order.employeeId){
            const emp = gameState.employees.find(e=>e.id===order.employeeId);
            if(emp){
                const speedWithPerks = emp.speed * (1 + (emp.perks?.speedBonus || 0));
                order.timeRemaining -= speedWithPerks;

                if(order.timeRemaining <= 0 && !order.completed){
                    gameState.money += order.reward;
                    gameState.totalOrdersCompleted++;
                    emp.isBusy = false;
                    emp.ordersCompleted++;
                    if(emp.ordersCompleted % GAME_CONFIG.employeeSpeedIncrementEvery === 0 &&
                        emp.speed < GAME_CONFIG.employeeMaxSpeed) emp.speed += 1;
                    renderEmployees()    
                    order.completed = true;
                }
            }
        }
    });

    // Удаляем завершённые заказы
    gameState.orders = gameState.orders.filter(o=>!o.completed);

    updateUI();
    saveGame();
}

const GAME_VERSION = '0.0.2'; 

function saveGame() {
    const stateToSave = { ...gameState, _version: GAME_VERSION };
    localStorage.setItem('gameState', JSON.stringify(stateToSave));
}

function loadGame() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed._version !== GAME_VERSION) {
            localStorage.removeItem('gameState');
            return;
        }

        gameState = parsed;

        gameState.employees.forEach(emp => {
            if (emp.isBusy === undefined) emp.isBusy = false;
            if (emp.speed === undefined) emp.speed = 1;
            if (emp.ordersCompleted === undefined) emp.ordersCompleted = 0;
            if (emp.autoWork === undefined) emp.autoWork = false;
        });
    }
}

// --------- Уведомления ---------
function showNotification(msg,color){
    const n = document.createElement('div'); n.textContent=msg;
    n.style.background=color; n.style.color='white';
    n.style.padding='10px'; n.style.borderRadius='8px';
    n.style.position='fixed'; n.style.top='20px'; n.style.right='20px'; n.style.zIndex='1000';
    document.body.appendChild(n);
    setTimeout(()=>{n.style.opacity='0'; setTimeout(()=>n.remove(),500)},2000);
}

// --------- Вкладки ---------
shopPartsBtn.addEventListener('click',()=>{gameState.currentShopTab='parts'; renderShop();});
shopEmployeesBtn.addEventListener('click',()=>{gameState.currentShopTab='employees'; renderShop();});
shopUpgradesBtn.addEventListener('click',()=>{gameState.currentShopTab='upgrades'; renderShop();});

// --------- Инициализация ---------
loadGame();
updateUI();
renderEmployees();
renderOrders();
renderShop();
setInterval(gameLoop,100);
setInterval(saveGame,1000);



