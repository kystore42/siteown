// --------- Конфигурация игры ---------
const GAME_CONFIG = {
    startMoney: 1000,
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
    upgradeCost: 100,
    employeeSpeedIncrease: 0.5,
    orderInterval: 3000,
    employeeSpeedIncrementEvery: 5,
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
    currentShopTab: 'parts'
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
    else if(btn.dataset.action==='resetGame') resetGame();

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
    {type:'Телефон', partsRequired:{battery:1, cpu:1, ram:1}, initialTime:100, reward:25},
    {type:'Ноутбук', partsRequired:{battery:2, cpu:1, ram:2, motherboard:1}, initialTime:150, reward:50},
    {type:'ПК', partsRequired:{cpu:1, gpu:1, ram:2, motherboard:1, case:1}, initialTime:200, reward:75},
    {type:'Сервер', partsRequired:{cpu:2, ram:4, motherboard:1, case:1, gpu:2}, initialTime:300, reward:150}
];

function createOrder(){
    let available=[ORDER_TEMPLATES[0]];
    if(gameState.totalOrdersCompleted>=5) available.push(ORDER_TEMPLATES[1]);
    if(gameState.totalOrdersCompleted>=15) available.push(ORDER_TEMPLATES[2]);
    if(gameState.totalOrdersCompleted>=30) available.push(ORDER_TEMPLATES[3]);
    const tpl=available[Math.floor(Math.random()*available.length)];
    gameState.orders.push({
        id:gameState.orderCount++,
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

    unassigned.forEach(order=>{
        const emp = freeEmployees.shift();
        if(emp && canAssignOrder(order)){
            assignOrderToEmployee(order, emp);
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

