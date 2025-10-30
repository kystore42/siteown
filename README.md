# 🔧 WSD Service

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

**Симулятор сервисного центра с элементами idle-кликера**

[🎮 Играть онлайн](#) | [📖 Документация](#особенности) | [🐛 Сообщить об ошибке](https://github.com/kystore42/wsd-service/issues)

![Game Screenshot](screenshot.png)

</div>

---

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Особенности](#-особенности)
- [Скриншоты](#-скриншоты)
- [Установка](#-установка)
- [Как играть](#-как-играть)
- [Механики игры](#-механики-игры)
- [Технологии](#-технологии)
- [Roadmap](#-roadmap)
- [Вклад в проект](#-вклад-в-проект)
- [Лицензия](#-лицензия)
- [Контакты](#-контакты)

---

## 🎯 О проекте

**WSD Service** — это увлекательный браузерный симулятор сервисного центра по ремонту техники. Управляйте своей мастерской, нанимайте сотрудников, выполняйте заказы и развивайте бизнес!

### 🌟 Почему WSD Service?

- 🎮 **Затягивающий геймплей** — стратегия + idle-механики
- 🎨 **Современный дизайн** — красивый UI с анимациями
- 🏆 **Система прогрессии** — достижения, престиж, комбо
- 💾 **Автосохранение** — не потеряете прогресс
- 📱 **Адаптивность** — играйте на любом устройстве
- 🆓 **Абсолютно бесплатно** — без рекламы и микротранзакций

---

## ✨ Особенности

### 🎯 Основной геймплей

- **📋 Система заказов** — 7+ типов техники для ремонта
- **👥 Найм сотрудников** — каждый с уникальными перками
- **🔧 Управление ресурсами** — 6 типов деталей
- **💰 Экономика** — зарабатывайте и вкладывайте деньги
- **🎲 Drag & Drop** — перетаскивайте сотрудников на заказы

### 🚀 Продвинутые механики

#### 🏆 Система достижений
Открывайте достижения и получайте награды:
- 🎯 Первый заказ
- ⚡ Опытный мастер (10 заказов)
- 🏆 Профессионал (50 заказов)
- 👑 Легенда (100 заказов)
- 💰 Богач (50000 денег)
- 👥 Командная работа (5 сотрудников)
- 🔥 Комбо мастер (комбо x5)
- ⭐ Редкий клиент

#### 👑 Престиж-система
- Сбросьте прогресс для получения **постоянных бонусов**
- Каждый уровень престижа: **+10%** к наградам за заказы
- Бесконечная реиграбельность

#### ⚡ Комбо-система
- Выполняйте заказы подряд для увеличения комбо
- Каждый уровень комбо: **+5%** к награде
- Комбо сбрасывается через 5 секунд бездействия

#### 🎲 Случайные события
**Позитивные:**
- ⚡ Час пик — +50% к наградам на 15 сек
- 💸 Скидка от поставщика — -30% к ценам на 20 сек
- 🎁 Бонусный клиент — мгновенная денежная награда
- 📢 Вирусная реклама — +3 заказа моментально

**Негативные:**
- 💥 Неожиданная поломка — потеря деталей
- 🚫 Забастовка сотрудников — -50% к скорости на 10 сек

#### 🎨 Система перков сотрудников
Каждый сотрудник может иметь случайные перки:
- ⚡ **Скорость** — работает быстрее (5-20%)
- 🔧 **Экономия** — шанс не потратить детали (15-40%)
- 💥 **Поломка** — шанс сломать детали (5-20%)
- 💰 **Бонусная награда** — больше денег за заказ (10-40%)
- 📚 **Ускоренное обучение** — быстрее повышает навык (20-70%)

### 🛠️ Улучшения

- **⚡ Ускорение сотрудников** — повышайте базовую скорость
- **📦 Регулярные поставки** — автоматическая доставка деталей
- **📋 Расширение заказов** — увеличьте лимит одновременных заказов
- **🤖 Автоматизация** — сотрудники берут заказы самостоятельно
- **👑 Престиж** — сброс с постоянными бонусами

---

## 📸 Скриншоты

<div align="center">

### Главный экран игры
![Main Screen](screenshots/main.png)

### Система сотрудников
![Employees](screenshots/employees.png)

### Магазин улучшений
![Shop](screenshots/shop.png)

### Достижения
![Achievements](screenshots/achievements.png)

</div>

---

## 🚀 Установка

### Вариант 1: Локальный запуск
```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/wsd-service.git

# Перейдите в папку проекта
cd wsd-service

# Откройте index.html в браузере
# Или запустите локальный сервер:
python -m http.server 8000
# Откройте http://localhost:8000
```

### Вариант 2: GitHub Pages

1. Fork этот репозиторий
2. Зайдите в Settings → Pages
3. Выберите ветку `main` и папку `root`
4. Игра будет доступна по адресу: `https://yourusername.github.io/wsd-service`

### Вариант 3: Просто скачайте

1. Нажмите `Code` → `Download ZIP`
2. Распакуйте архив
3. Откройте `index.html` в любом браузере

---

## 🎮 Как играть

### Начало игры

1. **📋 Получайте заказы** — они появляются автоматически каждые 3 секунды
2. **👥 Наймите сотрудников** — начните с одного стажера
3. **🎯 Назначайте на заказы** — перетащите сотрудника на заказ (Drag & Drop)
4. **💰 Получайте награды** — за выполненные заказы
5. **📈 Развивайтесь** — покупайте детали, нанимайте сотрудников, улучшайте навыки

### Советы для новичков

💡 **Совет 1:** Нанимайте сотрудников с перком "Экономия" — они экономят детали!

💡 **Совет 2:** Поддерживайте комбо для бонусных наград!

💡 **Совет 3:** Редкие заказы (с золотой рамкой) дают x2 награды!

💡 **Совет 4:** Автоматизируйте лучших сотрудников для пассивного дохода!

💡 **Совет 5:** Покупайте "Регулярные поставки" как можно раньше!

---

## 🎯 Механики игры

### Типы заказов

| Тип | Требования | Время | Награда | Открывается |
|-----|-----------|-------|---------|-------------|
| 📱 Телефон | 🔋×1 🖥️×1 💿×1 | 100s | ~25💰 | С начала |
| 💻 Ноутбук | 🔋×2 🖥️×1 💿×2 💻×1 | 150s | ~50💰 | 5 заказов |
| 🖥️ ПК | 🖥️×1 🎮×1 💿×2 💻×1 🖱️×1 | 200s | ~75💰 | 15 заказов |
| 🗄️ Сервер | 🖥️×2 💿×4 💻×1 🖱️×1 🎮×2 | 300s | ~150💰 | 30 заказов |
| 💎 Суперкомпьютер | 🖥️×4 💿×8 💻×2 🖱️×2 🎮×4 🔋×5 | 500s | ~1000💰 | 50 заказов |
| 📱 Планшет | 🔋×1 💿×2 🖥️×1 | 120s | ~40💰 | 10 заказов |
| 🎮 Игровая консоль | 🖥️×1 🎮×1 💿×1 🖱️×1 | 180s | ~60💰 | 20 заказов |

### Детали

| Деталь | Иконка | Цена |
|--------|--------|------|
| Батарея | 🔋 | 10💰 |
| ОЗУ | 💿 | 20💰 |
| Корпус | 🖱️ | 25💰 |
| Процессор | 🖥️ | 40💰 |
| Материнская плата | 💻 | 50💰 |
| Видеокарта | 🎮 | 100💰 |

### Прогрессия сотрудников

- Каждые **5 заказов** — +1 к скорости
- Максимальная скорость: **10**
- С перком "Ускоренное обучение" — быстрее

### Формула награды
```
Финальная награда = Базовая × (1 + БонусПерка) × (1 + КомбоБонус) × (1 + ПрестижБонус) × МножительСобытия
```

---

## 🛠️ Технологии

- **HTML5** — структура игры
- **CSS3** — стилизация и анимации
  - Gradients
  - Animations & Transitions
  - Flexbox & Grid
  - Backdrop Filter
- **Vanilla JavaScript** — игровая логика
  - LocalStorage для сохранений
  - Drag & Drop API
  - Event-driven архитектура
  - Модульная структура кода

### Требования

- Современный браузер (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript включен
- LocalStorage доступен

---

## 🗺️ Roadmap

### Версия 2.1 (В разработке)

- [ ] 🎵 Звуковые эффекты
- [ ] 🌙 Темная/светлая тема
- [ ] 📊 Детальная статистика
- [ ] 🏪 Магазин скинов для сотрудников
- [ ] 🎯 Ежедневные задания

### Версия 2.2 (Планируется)

- [ ] 🌐 Мультиязычность (EN, RU, ES)
- [ ] 🏆 Таблица лидеров
- [ ] 👥 Соревновательный режим
- [ ] 🎨 Кастомизация интерфейса
- [ ] 📱 PWA поддержка

### Версия 3.0 (Будущее)

- [ ] 🏭 Расширение мастерской
- [ ] 🌍 Система локаций
- [ ] 🎓 Обучение сотрудников
- [ ] 🔬 Исследования технологий
- [ ] 💼 Система контрактов

---

## 🤝 Вклад в проект

Мы приветствуем любой вклад в развитие проекта!

### Как помочь проекту

1. **🐛 Сообщайте об ошибках** — создайте [Issue](https://github.com/kystore42/wsd-service/issues)
2. **💡 Предлагайте идеи** — опишите вашу идею в [Discussions](https://github.com/kystore42/wsd-service/discussions)
3. **🔧 Вносите изменения** — создайте Pull Request

### Шаги для контрибуции
```bash
# 1. Fork репозиторий
# 2. Создайте ветку для фичи
git checkout -b feature/amazing-feature

# 3. Внесите изменения и закоммитьте
git commit -m "Add: amazing feature"

# 4. Запушьте изменения
git push origin feature/amazing-feature

# 5. Откройте Pull Request
```

### Правила кода

- ✅ Используйте осмысленные имена переменных
- ✅ Комментируйте сложную логику
- ✅ Следуйте существующему стилю кода
- ✅ Тестируйте изменения перед PR

---

## 📜 Лицензия

Этот проект распространяется под лицензией **MIT License**.
```
MIT License

Copyright (c) 2025 devrip

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Контакты

<div align="center">

**Автор:** Devrip (https://github.com/kystore42)

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kystore42)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:your.email@example.com)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/arhfuo)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/yourserver)

</div>

---

## 🙏 Благодарности

- 🎨 Вдохновение: [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/), [AdVenture Capitalist](https://store.steampowered.com/app/346900/AdVenture_Capitalist/)
- 🎮 Идеи геймплея: сообщество /r/incremental_games
- 💡 Фидбек: все кто тестировал игру
- 🔧 Технические решения: Stack Overflow, MDN Web Docs

---

## ⭐ Звезды

Если вам понравился проект, поставьте звезду! ⭐

<div align="center">

**Сделано с ❤️ для любителей idle-игр**

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=kystore42.wsd-service)
![Stars](https://img.shields.io/github/stars/kystore42/wsd-service?style=social)
![Forks](https://img.shields.io/github/forks/kystore42/wsd-service?style=social)

[⬆ Вернуться к началу](#-wsd-service)

</div>
