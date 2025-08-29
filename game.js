// --------- Конфигурация игры ---------
const GAME_CONFIG = {
    startMoney: 1500,
    startParts: { battery: 5, motherboard: 5, cpu: 5, gpu: 5, case: 5, ram: 5 },
    partCost: { battery: 10, motherboard: 50, cpu: 40, gpu: 100, case: 25, ram: 20 },
    upgradeCost: 100,
    supplyUpgradeCost: 10000,
    supplyInterval: 35000,
    supplyAmount: { battery: 2, motherboard: 1, cpu: 1, gpu: 1, case: 1, ram: 2 },
    employeeSpeedIncrease: 0.5,
    orderInterval: 3000,
    employeeSpeedIncrementEvery: 5,
    maxOrders: 10,
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
function renderEmployees(){
    employeeListElement.innerHTML = '';
    gameState.employees.forEach((emp, idx) => {
        const card = document.createElement('div');
        card.className = 'employee-card p-2 border rounded cursor-grab';
        card.draggable = !emp.isBusy;
        card.dataset.empId = emp.id;
        card.innerHTML = `
            <div class="text-4xl mb-2">${emp.avatar}</div>
            <div class="text-lg font-bold">Сотрудник #${idx + 1}</div>
            <div class="text-sm text-gray-600 employee-speed">Скорость: ${emp.speed.toFixed(2)}</div>
            <div class="text-sm text-gray-500 employee-status">${emp.isBusy ? '🛠 Выполняет заказ' : '✅ Свободен'}</div>
            <div class="text-xs text-gray-400">
                Перки: ${emp.perks ? 
                    `+${(emp.perks.speedBonus*100).toFixed(0)}% скорость, ` +
                    `${(emp.perks.savePartChance*100||0).toFixed(0)}% шанс сэкономить деталь, ` +
                    `${(emp.perks.breakPartChance*100||0).toFixed(0)}% шанс сломать деталь` 
                    : 'Нет'}
            </div>
        `;
        card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', emp.id));
        employeeListElement.appendChild(card);
    });
}

function renderOrders(){
    orderListElement.innerHTML = '';
    gameState.orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card p-2 border rounded mb-2';
        card.dataset.orderId = order.id;

        const partsText = Object.entries(order.partsRequired)
            .map(([p,qty])=>`${PART_ICONS[p]} x${qty}`).join(' ');

        card.innerHTML = `
            <div class="font-semibold">Заказ #${order.id}</div>
            <div>Техника: ${order.type}</div>
            <div>Награда: 💰${order.reward}</div>
            <div>Нужно деталей: ${partsText}</div>
            <div class="progress-bar-container" style="width:100%; background:#ccc; border-radius:4px;">
                <div class="progress-bar" style="width:0%;background-color:#10b981;height:8px;border-radius:4px;"></div>
            </div>
            <div class="order-employee" style="margin-top:4px; color:${order.employeeId?'#10b981':'#999'}">
                ${order.employeeId ? `В работе: ${gameState.employees.find(e=>e.id===order.employeeId)?.avatar}` : 'Свободен'}
            </div>
        `;
        orderListElement.appendChild(card);
    });
    renderOrders();
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
const ORDER_TEMPLATES = [
    { type:'Телефон', minCompleted:0, partsRequired:{battery:1,cpu:1,ram:1}, initialTime:100, reward:25 },
    { type:'Ноутбук', minCompleted:5, partsRequired:{battery:2,cpu:1,ram:2,motherboard:1}, initialTime:150, reward:50 },
    { type:'ПК', minCompleted:15, partsRequired:{cpu:1,gpu:1,ram:2,motherboard:1,case:1}, initialTime:200, reward:75 },
    { type:'Сервер', minCompleted:30, partsRequired:{cpu:2,ram:4,motherboard:1,case:1,gpu:2}, initialTime:300, reward:150 },
    { type:'Суперкомпьютер', minCompleted:50, partsRequired:{cpu:4,ram:8,motherboard:2,case:2,gpu:4,battery:5}, initialTime:500, reward:1000, rare:true }
];

function createOrder(){
    if(gameState.orders.length>=GAME_CONFIG.maxOrders) return;
    const available = ORDER_TEMPLATES.filter(o=>gameState.totalOrdersCompleted>=o.minCompleted);
    const rareOrders = available.filter(o=>o.rare);
    const normalOrders = available.filter(o=>!o.rare);
    let tpl = (rareOrders.length && Math.random()<0.1)
        ? rareOrders[Math.floor(Math.random()*rareOrders.length)]
        : normalOrders[Math.floor(Math.random()*normalOrders.length)];
    gameState.orders.push({
        id: gameState.orderCount++,
        type: tpl.type,
        partsRequired: {...tpl.partsRequired},
        initialTime: tpl.initialTime,
        timeRemaining: tpl.initialTime,
        reward: tpl.reward,
        employeeId: null
    });
    renderOrders();
}

// --------- Назначение сотрудника ---------
function assignEmployeeToOrder(empId, orderId){
    const emp = gameState.employees.find(e=>e.id===empId);
    const order = gameState.orders.find(o=>o.id===orderId);
    if(!emp||!order) return;
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
    if(!order.timeRemaining||order.timeRemaining<=0) order.timeRemaining = order.initialTime;

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
            speedBonus: Math.random() < 0.5 ? 0.05 : 0,
            savePartChance: Math.random() < 0.3 ? 0.3 : 0,
            breakPartChance: Math.random() < 0.1 ? 0.1 : 0
        };

        gameState.employees.push({
            id: `emp-${Date.now()}`,
            avatar,
            speed: 1,
            isBusy: false,
            ordersCompleted: 0,
            perks
        });

        renderEmployees();
        updateUI();
        showNotification('Нанят новый сотрудник!','green');
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

// --------- Игровой цикл ---------
function gameLoop(){
    if(Date.now()-gameState.lastOrderTime>GAME_CONFIG.orderInterval){ createOrder(); gameState.lastOrderTime=Date.now(); }
    gameState.orders.forEach(order=>{
        if(order.employeeId){
            const emp = gameState.employees.find(e=>e.id===order.employeeId);
            if(emp){
                const speedWithPerks = emp.speed*(1+(emp.perks.speedBonus||0));
                order.timeRemaining -= speedWithPerks;
                if(order.timeRemaining<=0){
                    gameState.money+=order.reward;
                    gameState.totalOrdersCompleted++;
                    emp.isBusy=false;
                    emp.ordersCompleted++;
                    if(emp.ordersCompleted%GAME_CONFIG.employeeSpeedIncrementEvery===0 && emp.speed<GAME_CONFIG.employeeMaxSpeed) emp.speed+=1;
                }
            }
        }
    });
    gameState.orders = gameState.orders.filter(o=>o.timeRemaining>0);
    updateUI();
    saveGame();
}

// --------- Сохранение/загрузка ---------
function saveGame(){ localStorage.setItem('gameState',JSON.stringify(gameState)); }
function loadGame(){
    const saved = localStorage.getItem('gameState');
    if(saved){ gameState = JSON.parse(saved);
        gameState.employees.forEach(emp=>{
            if(emp.isBusy===undefined) emp.isBusy=false;
            if(emp.speed===undefined) emp.speed=1;
            if(emp.ordersCompleted===undefined) emp.ordersCompleted=0;
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

