// --------- Игровое состояние ---------
let gameState = {
    money: 100,
    parts: 10,
    employees: [],
    orders: [],
    lastOrderTime: Date.now(),
    orderInterval: 3000,
    orderCount: 0,
    totalOrdersCompleted: 0,
    employeeHireCost: 45,
    partCost: 10,
    currentShopTab: 'parts'
};

// --------- Шаблоны заказов ---------
const ORDER_TEMPLATES = [
    { type: 'Телефон', partsRequired: 1, initialTime: 100, reward: 25 },
    { type: 'Ноутбук', partsRequired: 2, initialTime: 150, reward: 50 },
    { type: 'ПК', partsRequired: 3, initialTime: 200, reward: 75 },
    { type: 'Сервер', partsRequired: 5, initialTime: 300, reward: 150 }
];

// --------- Аватары сотрудников ---------
const EMPLOYEE_AVATARS = ['👨‍🔧','👩‍🔧','👨‍🔬','👩‍🔬','🧑‍💻','👨‍🏭'];

document.addEventListener('DOMContentLoaded', () => {
    // --------- DOM элементы ---------
    const moneyElement = document.getElementById('money');
    const partsElement = document.getElementById('parts');
    const employeeListElement = document.getElementById('employeeList');
    const orderListElement = document.getElementById('orderList');
    const shopPartsBtn = document.getElementById('shopPartsBtn');
    const shopEmployeesBtn = document.getElementById('shopEmployeesBtn');
    const shopContentElement = document.getElementById('shopContent');
// --------- Обновление UI без перерисовки кнопок ---------
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

// --------- Магазин: создаём кнопки один раз ---------
function renderShop() {
    shopContentElement.innerHTML = '';

    if (gameState.currentShopTab === 'parts') {
        const container = document.createElement('div');
        container.className = 'flex gap-2 flex-wrap';
        [1,5,10].forEach(amount => {
            const btn = document.createElement('button');
            btn.textContent = `Купить ${amount} 🔋 (💰${gameState.partCost*amount})`;
            btn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md';
            btn.disabled = gameState.money < gameState.partCost*amount;
            if(btn.disabled) btn.classList.add('opacity-50','cursor-not-allowed');
            btn.addEventListener('click', () => buyParts(amount));
            container.appendChild(btn);
        });
        shopContentElement.appendChild(container);
    } else {
        const btn = document.createElement('button');
        btn.textContent = `Нанять сотрудника (💰${gameState.employeeHireCost})`;
        btn.className = 'bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full shadow-md';
        btn.disabled = gameState.money < gameState.employeeHireCost;
        if(btn.disabled) btn.classList.add('opacity-50','cursor-not-allowed');
        btn.addEventListener('click', hireEmployee);
        shopContentElement.appendChild(btn);
    }

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Сбросить игру';
    resetBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-md mt-4';
    resetBtn.addEventListener('click', resetGame);
    shopContentElement.appendChild(resetBtn);
}

 shopPartsBtn.addEventListener('click', ()=>{
    gameState.currentShopTab='parts';
    renderShop(); // только один раз при смене вкладки
});
shopEmployeesBtn.addEventListener('click', ()=>{
    gameState.currentShopTab='employees';
    renderShop();
});

    
// --------- Покупка деталей с выбором количества ---------
function buyParts(amount) {
    const totalCost = gameState.partCost * amount;
    if (gameState.money >= totalCost) {
        gameState.money -= totalCost;
        gameState.parts += amount;
        updateUI();
    } else {
        showNotification('Недостаточно денег!', 'red');
    }
}

// --------- Делегирование событий магазина ---------
shopContentElement.addEventListener('click',e=>{
    if(e.target.dataset.action==='buyPart') buyPart();
    if(e.target.dataset.action==='hireEmployee') hireEmployee();
});

// --------- Заказы ---------
function createOrder(){
    let available=[ORDER_TEMPLATES[0]];
    if(gameState.totalOrdersCompleted>=5) available.push(ORDER_TEMPLATES[1]);
    if(gameState.totalOrdersCompleted>=15) available.push(ORDER_TEMPLATES[2]);
    if(gameState.totalOrdersCompleted>=30) available.push(ORDER_TEMPLATES[3]);
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
    while(Date.now() - gameState.lastOrderTime > gameState.orderInterval){
        createOrder();
        gameState.lastOrderTime += gameState.orderInterval;
    }

    let unassigned = gameState.orders.filter(o=>o.employeeId===null);
    let freeEmployees = gameState.employees.filter(e=>!e.isBusy);

    unassigned.forEach(order=>{
        if(gameState.parts>=order.partsRequired && freeEmployees.length>0){
            const emp = freeEmployees.shift();
            emp.isBusy = true;
            order.employeeId = emp.id;
            gameState.parts -= order.partsRequired;
        }
    });

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

    gameState.orders = gameState.orders.filter(o=>o.timeRemaining>0);

    updateUI();
}

// --------- Действия игрока ---------
function hireEmployee(){
    if(gameState.money>=gameState.employeeHireCost){
        gameState.money -= gameState.employeeHireCost;
        const avatar = EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:`emp-${Date.now()}`,isBusy:false,speed:1,ordersCompleted:0,avatar});
        gameState.employeeHireCost += 20;
        updateUI();
    } else showNotification('Недостаточно денег!','red');
}

function buyPart(){
    if(gameState.money>=gameState.partCost){
        gameState.money -= gameState.partCost;
        gameState.parts += 1;
        updateUI();
    } else showNotification('Недостаточно денег!','red');
}

// --------- Сброс игры ---------
function resetGame(){
    localStorage.removeItem('gameState');

    gameState = {
        money: 100,
        parts: 5,
        employees: [],
        orders: [],
        lastOrderTime: Date.now(),
        orderInterval: 3000,
        orderCount: 0,
        totalOrdersCompleted: 0,
        employeeHireCost: 45,
        partCost: 10,
        currentShopTab: 'parts'
    };

    const avatar=EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
    gameState.employees.push({id:'emp-0',isBusy:false,speed:1,ordersCompleted:0,avatar});
    createOrder();
    updateUI();
    saveGame();
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
function saveGame(){localStorage.setItem('gameState',JSON.stringify(gameState))}
function loadGame(){
    const saved = localStorage.getItem('gameState');
    if(saved){
        gameState = JSON.parse(saved);
        gameState.employees.forEach(emp=>{
            if(emp.isBusy===undefined) emp.isBusy=false;
            if(emp.speed===undefined) emp.speed=1;
            if(emp.ordersCompleted===undefined) emp.ordersCompleted=0;
        });
    } else {
        const avatar=EMPLOYEE_AVATARS[Math.floor(Math.random()*EMPLOYEE_AVATARS.length)];
        gameState.employees.push({id:'emp-0',isBusy:false,speed:1,ordersCompleted:0,avatar});
        createOrder();
    }
}

// --------- Слушатели ---------
shopPartsBtn.addEventListener('click',()=>{gameState.currentShopTab='parts'; renderShop();});
shopEmployeesBtn.addEventListener('click',()=>{gameState.currentShopTab='employees'; renderShop();});

// --------- Инициализация ---------
    loadGame();
    if (gameState.employees.length === 0) {
        const avatar = EMPLOYEE_AVATARS[Math.floor(Math.random() * EMPLOYEE_AVATARS.length)];
        gameState.employees.push({ id: 'emp-0', isBusy: false, speed: 1, ordersCompleted: 0, avatar });
    }
    updateUI();
    setInterval(gameLoop, 100);
    setInterval(saveGame, 1000);
});





