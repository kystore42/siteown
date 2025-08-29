// --------- Конфигурация игры ---------
const GAME_CONFIG = {
    startMoney: 100,
    startParts: 10,
    employeeHireCost: 45,
    partCost: 10,
    upgradeCost: 100,
    employeeSpeedIncrease: 0.5,
    orderInterval: 3000,
    orderTemplates: [
        { type: 'Телефон', partsRequired: 1, initialTime: 100, reward: 25 },
        { type: 'Ноутбук', partsRequired: 2, initialTime: 150, reward: 50 },
        { type: 'ПК', partsRequired: 3, initialTime: 200, reward: 75 },
        { type: 'Сервер', partsRequired: 5, initialTime: 300, reward: 150 }
    ],
    employeeSpeedIncrementEvery: 5, // каждый n заказов +1 скорость
    employeeMaxSpeed: 10
};

// --------- Игровое состояние ---------
let gameState = {
    money: GAME_CONFIG.startMoney,
    parts: GAME_CONFIG.startParts,
    employees: [],
    orders: [],
    lastOrderTime: Date.now(),
    orderCount: 0,
    totalOrdersCompleted: 0,
    employeeHireCost: GAME_CONFIG.employeeHireCost,
    partCost: GAME_CONFIG.partCost,
    currentShopTab: 'parts'
};

// --------- Аватары сотрудников ---------
const EMPLOYEE_AVATARS = ['👨‍🔧','👩‍🔧','👨‍🔬','👩‍🔬','🧑‍💻','👨‍🏭'];

// --------- DOM элементы ---------
const moneyElement = document.getElementById('money');
const partsElement = document.getElementById('parts');
const employeeListElement = document.getElementById('employeeList');
const orderListElement = document.getElementById('orderList');
const shopPartsBtn = document.getElementById('shopPartsBtn');
const shopEmployeesBtn = document.getElementById('shopEmployeesBtn');
const shopUpgradesBtn = document.getElementById('shopUpgradesBtn');
const shopContentElement = document.getElementById('shopContent');

// --------- UI обновление ---------
function updateUI() {
    moneyElement.textContent = gameState.money;
    partsElement.textContent = gameState.parts;

    // сотрудники
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

    // заказы
    orderListElement.innerHTML='';
    gameState.orders.forEach(order=>{
        const card = document.createElement('div');
        card.className=`order-card ${order.employeeId!==null?'assigned':''}`;
        const progressPercent = Math.min(100, 100 - (order.timeRemaining/order.initialTime)*100);
        let progressColor='#10b981';
        if(progressPercent>50) progressColor='#facc15';
        if(progressPercent>90) progressColor='#ef4444';
        card.innerHTML=`
            <div class="text-lg font-semibold">Заказ #${order.id}</div>
            <div class="text-sm text-gray-500">Техника: ${order.type}</div>
            <div class="text-sm text-gray-500">Награда: 💰${order.reward}</div>
            <div class="text-sm text-gray-500">Нужно деталей: 🔋${order.partsRequired}</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${progressPercent}%;background-color:${progressColor}"></div>
            </div>
        `;
        orderListElement.appendChild(card);
    });
}

// Рендер магазина вызываем только при смене вкладки или после покупки/ресета
function renderShop() {
    shopContentElement.innerHTML='';

    if(gameState.currentShopTab==='parts'){
        const container = document.createElement('div');
        container.className = 'flex gap-2 flex-wrap';
        [1,5,10].forEach(amount=>{
            const btn = document.createElement('button');
            btn.textContent = `Купить ${amount} 🔋 (💰${gameState.partCost*amount})`;
            btn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md';
            btn.disabled = gameState.money < gameState.partCost*amount;
            if(btn.disabled) btn.classList.add('opacity-50','cursor-not-allowed');
            btn.dataset.action = 'buyPart';
            btn.dataset.amount = amount;
            container.appendChild(btn);
        });
        shopContentElement.appendChild(container);

    } else if(gameState.currentShopTab==='employees'){
        const btn=document.createElement('button');
        btn.textContent=`Нанять сотрудника (💰${gameState.employeeHireCost})`;
        btn.className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full shadow-md';
        btn.disabled = gameState.money<gameState.employeeHireCost;
        if(btn.disabled) btn.classList.add('opacity-50','cursor-not-allowed');
        btn.dataset.action='hireEmployee';
        shopContentElement.appendChild(btn);

    } else if(gameState.currentShopTab==='upgrades'){
        const btn=document.createElement('button');
        btn.textContent=`Ускорение сотрудников (💰${GAME_CONFIG.upgradeCost})`;
        btn.className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-md';
        btn.disabled = gameState.money< GAME_CONFIG.upgradeCost;
        if(btn.disabled) btn.classList.add('opacity-50','cursor-not-allowed');
        btn.dataset.action='upgradeEmployees';
        shopContentElement.appendChild(btn);
    }

    // Кнопка сброса
    const resetBtn = document.createElement('button');
    resetBtn.textContent='Сбросить игру';
    resetBtn.className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-md mt-4';
    resetBtn.dataset.action='resetGame';
    shopContentElement.appendChild(resetBtn);
}

// Делегирование клика
shopContentElement.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if(!btn || btn.disabled) return;

    const action = btn.dataset.action;
    if(action==='buyPart') buyParts(parseInt(btn.dataset.amount));
    else if(action==='hireEmployee') hireEmployee();
    else if(action==='upgradeEmployees') upgradeEmployees();
    else if(action==='resetGame') resetGame();

    // После действия рендерим магазин заново
    renderShop();
});

// --------- Делегирование событий магазина ---------
shopContentElement.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    if (!action || btn.disabled) return;

    if (action === 'buyPart') buyParts(parseInt(btn.dataset.amount));
    else if (action === 'hireEmployee') hireEmployee();
    else if (action === 'upgradeEmployees') upgradeEmployees();
    else if (action === 'resetGame') resetGame();
});

// --------- Заказы ---------
function createOrder(){
    let available=[GAME_CONFIG.orderTemplates[0]];
    if(gameState.totalOrdersCompleted>=5) available.push(GAME_CONFIG.orderTemplates[1]);
    if(gameState.totalOrdersCompleted>=15) available.push(GAME_CONFIG.orderTemplates[2]);
    if(gameState.totalOrdersCompleted>=30) available.push(GAME_CONFIG.orderTemplates[3]);
    const tpl=available[Math.floor(Math.random()*available.length)];
    gameState.orders.push({
        id:gameState.orderCount++,
        type:tpl.type,
        partsRequired:tpl.partsRequired,
        initialTime:tpl.initialTime,
        timeRemaining:tpl.initialTime,
        reward:tpl.reward,
        employeeId:null
    });
}

// --------- Игровой цикл ---------
function gameLoop(){
    if(Date.now()-gameState.lastOrderTime>GAME_CONFIG.orderInterval){
        createOrder();
        gameState.lastOrderTime=Date.now();
    }

    const unassigned=gameState.orders.filter(o=>o.employeeId===null);
    const freeEmployees=gameState.employees.filter(e=>!e.isBusy);

    unassigned.forEach(order=>{
        const emp=freeEmployees.shift();
        if(emp&&gameState.parts>=order.partsRequired){
            emp.isBusy=true;
            order.employeeId=emp.id;
            gameState.parts-=order.partsRequired;
        }
    });

    gameState.orders.forEach(order=>{
        if(order.employeeId!==null){
            const emp=gameState.employees.find(e=>e.id===order.employeeId);
            if(emp) order.timeRemaining-=emp.speed;
            if(order.timeRemaining<=0){
                gameState.money+=order.reward;
                gameState.totalOrdersCompleted++;
                if(emp){
                    emp.isBusy=false;
                    emp.ordersCompleted++;
                    if(emp.ordersCompleted % GAME_CONFIG.employeeSpeedIncrementEvery === 0 && emp.speed < GAME_CONFIG.employeeMaxSpeed) emp.speed += 1;
                }
            }
        }
    });

    gameState.orders=gameState.orders.filter(o=>o.timeRemaining>0);
    updateUI();
    saveGame();
}

// --------- Действия игрока ---------
function hireEmployee(){
    if(gameState.money>=gameState.employeeHireCost){
        gameState.money-=gameState.employeeHireCost;
        const avatar=EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:`emp-${Date.now()}`,isBusy:false,speed:1,ordersCompleted:0,avatar});
        gameState.employeeHireCost+=20;
        updateUI();
    } else showNotification('Недостаточно денег!','red');
}

function buyParts(amount){
    const totalCost = gameState.partCost * amount;
    if(gameState.money>=totalCost){
        gameState.money -= totalCost;
        gameState.parts += amount;
        updateUI();
    } else showNotification('Недостаточно денег!','red');
}

function upgradeEmployees(){
    if(gameState.money>=GAME_CONFIG.upgradeCost){
        gameState.money -= GAME_CONFIG.upgradeCost;
        gameState.employees.forEach(emp => emp.speed += GAME_CONFIG.employeeSpeedIncrease);
        showNotification('Все сотрудники стали быстрее!','green');
        updateUI();
    } else showNotification('Недостаточно денег!','red');
}

function resetGame(){
    if(!confirm('Вы уверены, что хотите сбросить игру? Все данные будут потеряны!')) return;

    localStorage.removeItem('gameState');

    gameState = {
        money: GAME_CONFIG.startMoney,
        parts: GAME_CONFIG.startParts,
        employees: [],
        orders: [],
        lastOrderTime: Date.now(),
        orderCount: 0,
        totalOrdersCompleted: 0,
        employeeHireCost: GAME_CONFIG.employeeHireCost,
        partCost: GAME_CONFIG.partCost,
        currentShopTab: 'parts'
    };

    const avatar = EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
    gameState.employees.push({id:`emp-${Date.now()}`,isBusy:false,speed:1,ordersCompleted:0,avatar});

    createOrder();
    updateUI();
}

// --------- Уведомления ---------
function showNotification(msg,color){
    const n=document.createElement('div');
    n.textContent=msg;
    n.style.backgroundColor=color;
    n.style.color='white';
    n.style.padding='10px';
    n.style.borderRadius='8px';
    n.style.position='fixed';
    n.style.top='20px';
    n.style.right='20px';
    n.style.zIndex='1000';
    n.style.transition='opacity 0.5s ease-in-out';
    document.body.appendChild(n);
    setTimeout(()=>{n.style.opacity='0';setTimeout(()=>n.remove(),500)},2000);
}

// --------- Сохранение/Загрузка ---------
function saveGame(){localStorage.setItem('gameState',JSON.stringify(gameState));}
function loadGame(){
    const s=localStorage.getItem('gameState');
    if(s) gameState=JSON.parse(s);

    gameState.employees.forEach(emp=>{
        if(emp.isBusy===undefined) emp.isBusy=false;
        if(emp.speed===undefined) emp.speed=1;
        if(emp.ordersCompleted===undefined) emp.ordersCompleted=0;
    });

    if(gameState.employees.length===0){
        const avatar = EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:`emp-${Date.now()}`,isBusy:false,speed:1,ordersCompleted:0,avatar});
    }
}

// --------- Слушатели вкладок ---------
shopPartsBtn.addEventListener('click',()=>{gameState.currentShopTab='parts';renderShop();});
shopEmployeesBtn.addEventListener('click',()=>{gameState.currentShopTab='employees';renderShop();});
shopUpgradesBtn.addEventListener('click',()=>{gameState.currentShopTab='upgrades';renderShop();});

// --------- Инициализация ---------
loadGame();
updateUI();
setInterval(gameLoop,100);
setInterval(saveGame,1000);




