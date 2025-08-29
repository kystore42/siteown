// --------- Конфигурация игры ---------
const GAME_CONFIG = {
    startMoney: 1500,
    startParts: {
        battery: 5,
        motherboard: 2,
        cpu: 2,
        gpu: 1,
        case: 1,
        ram: 4
    },
    partCost: {
        battery: 10,
        motherboard: 50,
        cpu: 40,
        gpu: 100,
        case: 25,
        ram: 20
    },
    upgradeCost: 100, // апгрейд ускорения сотрудников
    supplyUpgradeCost: 10000, // стоимость регулярных поставок
    supplyInterval: 35000,    // интервал поставок в мс (35 сек)
    supplyAmount: {            // сколько деталей добавляется каждые 35 сек
        battery: 2,
        motherboard: 1,
        cpu: 1,
        gpu: 1,
        case: 1,
        ram: 2
    },
    employeeSpeedIncrease: 0.5,
    orderInterval: 3000,
    employeeSpeedIncrementEvery: 5,
    maxOrders: 10,         // стартовый максимум заказов
    orderIncreaseCost: 5000, // стоимость апгрейда для расширения
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
const PART_ICONS = {
    battery: '🔋',
    motherboard: '💻',
    cpu: '🖥️',
    gpu: '🎮',
    case: '🖱️',
    ram: '📀'
};

// --------- UI обновление ---------
function updateUI() {
    moneyElement.textContent = gameState.money;

    // Обновляем детали
    let partsText = '';
    for(const key in gameState.parts){
        partsText += `${PART_ICONS[key]} ${gameState.parts[key]}  `;
    }
    partsElement.textContent = partsText;

    // Сотрудники
    employeeListElement.innerHTML = '';
    gameState.employees.forEach((emp,index)=>{
        const card = document.createElement('div');
        card.className='employee-card';
        card.innerHTML=`
            <div class="text-4xl mb-2">${emp.avatar}</div>
            <div class="text-lg font-bold">Сотрудник #${index+1}</div>
            <div class="text-sm text-gray-600">Скорость: ${emp.speed.toFixed(2)}</div>
            <div class="text-sm text-gray-500">${emp.isBusy ? '🛠 Выполняет заказ' : '✅ Свободен'}</div>
        `;
        employeeListElement.appendChild(card);
    });

    // Заказы
    orderListElement.innerHTML='';
    gameState.orders.forEach(order=>{
        const card = document.createElement('div');
        card.className=`order-card ${order.employeeId!==null?'assigned':''}`;
        const progressPercent = Math.min(100, 100 - (order.timeRemaining/order.initialTime)*100);
        let progressColor='#10b981';
        if(progressPercent>50) progressColor='#facc15';
        if(progressPercent>90) progressColor='#ef4444';
        let partsRequiredText = '';
        for(const p in order.partsRequired){
            partsRequiredText += `${PART_ICONS[p]} x${order.partsRequired[p]} `;
        }
        card.innerHTML=`
            <div class="text-lg font-semibold">Заказ #${order.id}</div>
            <div class="text-sm text-gray-500">Техника: ${order.type}</div>
            <div class="text-sm text-gray-500">Награда: 💰${order.reward}</div>
            <div class="text-sm text-gray-500">Нужно деталей: ${partsRequiredText}</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${progressPercent}%;background-color:${progressColor}"></div>
            </div>
        `;
        orderListElement.appendChild(card);
    });
}

// --------- Магазин ---------
function renderShop(){
    shopContentElement.innerHTML='';

    if(gameState.currentShopTab==='parts'){
        const container = document.createElement('div');
        container.className = 'flex flex-wrap gap-2 justify-center';
        for(const part in GAME_CONFIG.partCost){
            const partContainer = document.createElement('div');
            partContainer.className = 'flex flex-col gap-1 items-center';
            [1,10,100].forEach(amount=>{
                const btn = document.createElement('button');
                btn.textContent = `${PART_ICONS[part]} x${amount} (💰${GAME_CONFIG.partCost[part]*amount})`;
                btn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-md';
                btn.disabled = gameState.money < GAME_CONFIG.partCost[part]*amount;
                btn.dataset.action = 'buyPart';
                btn.dataset.part = part;
                btn.dataset.amount = amount;
                partContainer.appendChild(btn);
            });
            container.appendChild(partContainer);
        }
        shopContentElement.appendChild(container);
    } else if(gameState.currentShopTab==='employees'){
        const btn=document.createElement('button');
        btn.textContent=`Нанять сотрудника (💰100)`;
        btn.className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full';
        btn.dataset.action='hireEmployee';
        shopContentElement.appendChild(btn);
    } else if(gameState.currentShopTab==='upgrades'){
        const btn=document.createElement('button');
        btn.textContent=`Ускорение сотрудников (💰${GAME_CONFIG.upgradeCost})`;
        btn.className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full';
        btn.dataset.action='upgradeEmployees';
        shopContentElement.appendChild(btn);
        // Регулярные поставки
        const btnSupply = document.createElement('button');
        btnSupply.textContent = `Регулярные поставки (💰${GAME_CONFIG.supplyUpgradeCost})`;
        btnSupply.className = 'bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-full';
        btnSupply.dataset.action = 'buySupply';
        btnSupply.disabled = gameState.money < GAME_CONFIG.supplyUpgradeCost || gameState.supplyActive;
        shopContentElement.appendChild(btnSupply);
        const btnExpandOrders = document.createElement('button');
        btnExpandOrders.textContent = `Расширить лимит заказов (💰${GAME_CONFIG.orderIncreaseCost})`;
        btnExpandOrders.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full mt-2';
        btnExpandOrders.dataset.action = 'expandOrders';
        btnExpandOrders.disabled = gameState.money < GAME_CONFIG.orderIncreaseCost;
        shopContentElement.appendChild(btnExpandOrders);
    }

    // Кнопка сброса
    const resetBtn = document.createElement('button');
    resetBtn.textContent='Сбросить игру';
    resetBtn.className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full mt-4';
    resetBtn.dataset.action='resetGame';
    shopContentElement.appendChild(resetBtn);
}

// --------- Делегирование событий магазина ---------
shopContentElement.addEventListener('click', e=>{
    const btn = e.target.closest('button');
    if(!btn || btn.disabled) return;

    if(btn.dataset.action==='buyPart') buyParts(btn.dataset.part, parseInt(btn.dataset.amount));
    else if(btn.dataset.action==='hireEmployee') hireEmployee();
    else if(btn.dataset.action==='upgradeEmployees') upgradeEmployees();
    else if(btn.dataset.action==='buySupply') buySupply();
    else if(btn.dataset.action==='resetGame') resetGame();
    else if(btn.dataset.action==='expandOrders') expandOrders();

    renderShop();
});

// --------- Действия ---------
function buyParts(part, amount){
    const cost = GAME_CONFIG.partCost[part]*amount;
    if(gameState.money>=cost){
        gameState.money -= cost;
        gameState.parts[part] += amount;
        updateUI();
    } else showNotification('Недостаточно денег','red');
}

function hireEmployee(){
    const cost = 100;
    if(gameState.money>=cost){
        gameState.money -= cost;
        const avatar = GAME_CONFIG.EMPLOYEE_AVATARS[Math.floor(Math.random()*GAME_CONFIG.EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:`emp-${Date.now()}`, avatar, speed:1, isBusy:false, ordersCompleted:0});
        updateUI();
    } else showNotification('Недостаточно денег','red');
}

function upgradeEmployees(){
    if(gameState.money>=GAME_CONFIG.upgradeCost){
        gameState.money -= GAME_CONFIG.upgradeCost;
        gameState.employees.forEach(e=>e.speed += GAME_CONFIG.employeeSpeedIncrease);
        showNotification('Все сотрудники стали быстрее!','green');
        updateUI();
    } else showNotification('Недостаточно денег','red');
}

let supplyIntervalId = null; // для хранения интервала поставок
gameState.supplyActive = false; // активирован ли апгрейд

function buySupply(){
    if(gameState.money < GAME_CONFIG.supplyUpgradeCost){
        showNotification('Недостаточно денег','red');
        return;
    }
    gameState.money -= GAME_CONFIG.supplyUpgradeCost;
    gameState.supplyActive = true;

    // Запускаем регулярные поставки
    supplyIntervalId = setInterval(() => {
        for(const part in GAME_CONFIG.supplyAmount){
            gameState.parts[part] += GAME_CONFIG.supplyAmount[part];
        }
        showNotification('Регулярные поставки пополнили склад!','green');
        updateUI();
    }, GAME_CONFIG.supplyInterval);

    showNotification('Регулярные поставки активированы!','green');
}
function expandOrders(){
    if(gameState.money >= GAME_CONFIG.orderIncreaseCost){
        gameState.money -= GAME_CONFIG.orderIncreaseCost;
        GAME_CONFIG.maxOrders += 5; // увеличиваем лимит на 5
        showNotification('Лимит заказов увеличен!','green');
        renderShop();
        updateUI();
    } else {
        showNotification('Недостаточно денег','red');
    }
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
    gameState.employees.push({id:`emp-${Date.now()}`, avatar, speed:1, isBusy:false, ordersCompleted:0});
    updateUI();
}

// --------- Заказы ---------
const ORDER_TEMPLATES = [
    // Простые заказы
    { type:'Телефон', minCompleted:0, partsRequired:{battery:1, cpu:1, ram:1}, initialTime:100, reward:25 },
    { type:'Ноутбук', minCompleted:5, partsRequired:{battery:2, cpu:1, ram:2, motherboard:1}, initialTime:150, reward:50 },
    { type:'ПК', minCompleted:15, partsRequired:{cpu:1, gpu:1, ram:2, motherboard:1, case:1}, initialTime:200, reward:75 },
    { type:'Сервер', minCompleted:30, partsRequired:{cpu:2, ram:4, motherboard:1, case:1, gpu:2}, initialTime:300, reward:150 },
    // Редкий заказ (высокая сложность и награда)
    { type:'Суперкомпьютер', minCompleted:50, partsRequired:{cpu:4, ram:8, motherboard:2, case:2, gpu:4, battery:5}, initialTime:500, reward:1000, rare:true }
];

function createOrder(){
    // Доступные заказы
    if(gameState.orders.length >= GAME_CONFIG.maxOrders) return;
    const available = ORDER_TEMPLATES.filter(o => gameState.totalOrdersCompleted >= o.minCompleted);

    // Вероятность редких заказов (например, 10%)
    const rareOrders = available.filter(o => o.rare);
    const normalOrders = available.filter(o => !o.rare);

    let tpl;
    if(rareOrders.length && Math.random() < 0.1){ // 10% шанс редкого заказа
        tpl = rareOrders[Math.floor(Math.random() * rareOrders.length)];
    } else {
        tpl = normalOrders[Math.floor(Math.random() * normalOrders.length)];
    }

    gameState.orders.push({
        id: gameState.orderCount++,
        type: tpl.type,
        partsRequired: {...tpl.partsRequired},
        initialTime: tpl.initialTime,
        timeRemaining: tpl.initialTime,
        reward: tpl.reward,
        employeeId: null
    });
}

// --------- Работа с заказами ---------
function canAssignOrder(order){
    return Object.entries(order.partsRequired).every(([part, qty]) => gameState.parts[part] >= qty);
}

function assignOrderToEmployee(order, emp){
    Object.entries(order.partsRequired).forEach(([part, qty]) => gameState.parts[part] -= qty);
    emp.isBusy = true;
    order.employeeId = emp.id;
}

// --------- Игровой цикл ---------
function gameLoop(){
    if(Date.now() - gameState.lastOrderTime > GAME_CONFIG.orderInterval){
        createOrder();
        gameState.lastOrderTime = Date.now();
    }

const unassigned = gameState.orders.filter(o => o.employeeId === null);
const freeEmployees = gameState.employees.filter(e => !e.isBusy);

unassigned.forEach(order => {
    // Найдём первого свободного сотрудника, который может выполнить этот заказ
    for(let i = 0; i < freeEmployees.length; i++){
        const emp = freeEmployees[i];
        // Проверка, есть ли все нужные детали
        const canDo = Object.entries(order.partsRequired).every(([part, qty]) => gameState.parts[part] >= qty);
        if(canDo){
            // Назначаем заказ сотруднику
            Object.entries(order.partsRequired).forEach(([part, qty]) => gameState.parts[part] -= qty);
            emp.isBusy = true;
            order.employeeId = emp.id;
            
            // Убираем сотрудника из списка свободных
            freeEmployees.splice(i, 1);
            break; // Переходим к следующему заказу
        }
    }
});

    gameState.orders.forEach(order=>{
        if(order.employeeId !== null){
            const emp = gameState.employees.find(e => e.id === order.employeeId);
            if(emp){
                order.timeRemaining -= emp.speed;
                if(order.timeRemaining <= 0){
                    gameState.money += order.reward;
                    gameState.totalOrdersCompleted++;
                    emp.isBusy = false;
                    emp.ordersCompleted++;
                    if(emp.ordersCompleted % GAME_CONFIG.employeeSpeedIncrementEvery === 0 &&
                       emp.speed < GAME_CONFIG.employeeMaxSpeed) emp.speed += 1;
                }
            }
        }
    });

    gameState.orders = gameState.orders.filter(o => o.timeRemaining > 0);
    updateUI();
    saveGame();
}

// --------- Сохранение/Загрузка ---------
function saveGame(){ localStorage.setItem('gameState', JSON.stringify(gameState)); }
function loadGame(){
    const s = localStorage.getItem('gameState');
    if(s) gameState = JSON.parse(s);
    if(gameState.employees.length === 0){
        const avatar = GAME_CONFIG.EMPLOYEE_AVATARS[Math.floor(Math.random()*GAME_CONFIG.EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:`emp-${Date.now()}`, avatar, speed:1, isBusy:false, ordersCompleted:0});
    }
}

// --------- Уведомления ---------
function showNotification(msg,color){
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.background = color;
    n.style.color='white';
    n.style.padding='10px';
    n.style.borderRadius='8px';
    n.style.position='fixed';
    n.style.top='20px';
    n.style.right='20px';
    n.style.zIndex='1000';
    document.body.appendChild(n);
    setTimeout(()=>{n.style.opacity='0';setTimeout(()=>n.remove(),500)},2000);
}

// --------- Вкладки ---------
shopPartsBtn.addEventListener('click',()=>{gameState.currentShopTab='parts'; renderShop();});
shopEmployeesBtn.addEventListener('click',()=>{gameState.currentShopTab='employees'; renderShop();});
shopUpgradesBtn.addEventListener('click',()=>{gameState.currentShopTab='upgrades'; renderShop();});

// --------- Инициализация ---------
loadGame();
updateUI();
setInterval(gameLoop,100);
setInterval(saveGame,1000);
