// Массив, в котором храним все добавленные приборы
    let devices = [];

    // Селекторы элементов формы
    const deviceForm = document.getElementById('device-form');
    const deviceNameInput = document.getElementById('deviceName');
    const usageHoursInput = document.getElementById('usageHours');
    const powerInput = document.getElementById('power');
    const pricePerKwhInput = document.getElementById('pricePerKwh');
    const hoursErrorSpan = document.getElementById('hours-error');

    // Кнопки
    const calculateBtn = document.getElementById('calculateBtn');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Таблица
    const tableContainer = document.getElementById('table-container');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    /* 
      Проверка корректности ввода для поля "Время использования (часов)".
      Если пользователь вводит число > 24, просим ввести корректное значение.
    */
    usageHoursInput.addEventListener('input', () => {
      const value = Number(usageHoursInput.value);
      if (value > 24) {
        usageHoursInput.value = 24;
        hoursErrorSpan.textContent = 'Максимум 24 часа в сутки!';
      } else {
        hoursErrorSpan.textContent = '';
      }
    });

    /*
      Функция добавляет прибор в массив (если данные корректны),
      затем перерисовывает таблицу.
      Параметр skipCalculation управляет тем, пересчитывать ли значения (по умолчанию – да).
    */
    function addOrUpdateDevice(skipCalculation = false) {
      // Считываем значения из полей формы
      const name = deviceNameInput.value.trim();
      const hours = Number(usageHoursInput.value);
      const power = Number(powerInput.value);
      const price = Number(pricePerKwhInput.value);

      // Проверка обязательных полей
      if (!name || isNaN(hours) || isNaN(power) || isNaN(price)) {
        return; // Если данные некорректны, не добавляем прибор
      }

      // Создаем объект устройства
      const newDevice = {
        id: Date.now(), // Уникальный ID для идентификации/удаления
        name: name,
        usageHours: hours,
        power: power,
        pricePerKwh: price,
        enabled: true // По умолчанию прибор включен в расчёты
      };

      // Добавляем прибор в массив
      devices.push(newDevice);

      // Не очищаем поля формы, чтобы данные оставались видимыми
      // Перерисовываем таблицу с пересчетом значений
      renderTable(skipCalculation ? false : true);
    }

    /*
      Функция для отрисовки таблицы с актуальными данными приборов.
      Если doCalculation === true – для каждого прибора и периода выполняется расчет.
    */
    function renderTable(doCalculation = true) {
      // Если приборов нет — скрываем таблицу и выходим
      if (devices.length === 0) {
        tableContainer.style.display = 'none';
        return;
      }

      // Делаем таблицу видимой
      tableContainer.style.display = 'block';

      // Очищаем предыдущие данные в заголовке и теле таблицы
      tableHead.innerHTML = '';
      tableBody.innerHTML = '';

      // --------------------------
      // Генерация заголовка (THEAD)
      // --------------------------

      // Первая строка заголовка: "Период" + по 2 столбца для каждого прибора
      const headerRow = document.createElement('tr');

      // Первый столбец – "Период"
      const periodHeader = document.createElement('th');
      periodHeader.textContent = 'Период';
      headerRow.appendChild(periodHeader);

      // Для каждого прибора создаём 2 столбца: для потребления и для цены
      devices.forEach(device => {
        const consumptionHeader = document.createElement('th');

        // В заголовке: название прибора, его время использования и чекбокс (для включения/отключения)
        consumptionHeader.innerHTML = `
          <div class="device-header-controls">
            Потребление (кВт*ч)
            <br>
            Прибор "${device.name}" (${device.usageHours} ч)
            <input type="checkbox" ${device.enabled ? 'checked' : ''} data-id="${device.id}">
            <button class="delete-device-btn" data-id="${device.id}">&times;</button>
          </div>
        `;
        headerRow.appendChild(consumptionHeader);

        const priceHeader = document.createElement('th');
        priceHeader.innerHTML = `
          Цена (РУБ)
          <br>
          Прибор "${device.name}" (${device.usageHours} ч)
        `;
        headerRow.appendChild(priceHeader);
      });

      tableHead.appendChild(headerRow);

      // --------------------------
      // Генерация тела таблицы (TBODY)
      // --------------------------

      // Определяем периоды для расчёта
      const periods = [
        { label: '1 час', type: 'hour' },
        { label: '1 день', type: 'day' },
        { label: '1 месяц', type: 'month' },
        { label: '1 год', type: 'year' },
        { label: 'Пользовательское время', type: 'custom' }
      ];

      periods.forEach(period => {
        const row = document.createElement('tr');

        // Первая ячейка – название периода
        const periodCell = document.createElement('td');
        periodCell.textContent = period.label;
        row.appendChild(periodCell);

        // Для каждого прибора создаём по 2 ячейки: для потребления и для цены
        devices.forEach(device => {
          let consumption = 0; // кВт*ч
          let cost = 0; // РУБ

          if (doCalculation && device.enabled) {
            const powerKwt = device.power / 1000; 
            switch (period.type) {
              case 'hour':
                // 1 час работы
                consumption = powerKwt * 1;
                cost = consumption * device.pricePerKwh;
                break;
              case 'day':
                // За один день (с учетом времени использования)
                consumption = powerKwt * device.usageHours;
                cost = consumption * device.pricePerKwh;
                break;
              case 'month':
                // За месяц (30.44 дней)
                consumption = powerKwt * device.usageHours * 30.44;
                cost = consumption * device.pricePerKwh;
                break;
              case 'year':
                // За год (365.25 дней)
                consumption = powerKwt * device.usageHours * 365.25;
                cost = consumption * device.pricePerKwh;
                break;
              case 'custom':
                // "Пользовательское время" – используем время, введённое пользователем
                consumption = powerKwt * device.usageHours;
                cost = consumption * device.pricePerKwh;
                break;
            }
          }

          // Если расчет дал NaN или Infinity, подставляем 0
          if (isNaN(consumption) || !isFinite(consumption)) {
            consumption = 0;
          }
          if (isNaN(cost) || !isFinite(cost)) {
            cost = 0;
          }

          // Создаем ячейку для потребления
          const consumptionCell = document.createElement('td');
          consumptionCell.textContent = consumption.toFixed(4);
          row.appendChild(consumptionCell);

          // Создаем ячейку для цены
          const costCell = document.createElement('td');
          costCell.textContent = cost.toFixed(2);
          row.appendChild(costCell);
        });

        tableBody.appendChild(row);
      });

      // --------------------------
      // Добавляем строку "Общее значение"
      // --------------------------
      // Эта строка будет выводить суммарное потребление и стоимость для "Пользовательского времени"
      const overallRow = document.createElement('tr');
      const overallLabelCell = document.createElement('td');
      overallLabelCell.textContent = 'Общее значение';
      overallRow.appendChild(overallLabelCell);

      // Вычисляем суммарные показатели по всем включенным приборам
      let overallConsumption = 0;
      let overallCost = 0;
      devices.forEach(device => {
        if (device.enabled) {
          const powerKwt = device.power / 1000;
          // Для "Пользовательского времени" берем именно введённое пользователем время использования
          const deviceConsumption = powerKwt * device.usageHours;
          const deviceCost = deviceConsumption * device.pricePerKwh;
          overallConsumption += deviceConsumption;
          overallCost += deviceCost;
        }
      });

      const overallValueCell = document.createElement('td');
      // Объединяем все ячейки приборов в одну
      overallValueCell.setAttribute('colspan', devices.length * 2);
      overallValueCell.style.textAlign = 'center';
      overallValueCell.innerHTML = `Потребление: ${overallConsumption.toFixed(4)} кВт*ч<br>Стоимость: ${overallCost.toFixed(2)} РУБ`;
      overallRow.appendChild(overallValueCell);

      tableBody.appendChild(overallRow);

      // --------------------------
      // Привязываем обработчики для чекбоксов и кнопок удаления
      // --------------------------
      const checkboxes = tableHead.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const deviceId = Number(e.target.dataset.id);
          const deviceIndex = devices.findIndex(d => d.id === deviceId);
          if (deviceIndex > -1) {
            devices[deviceIndex].enabled = e.target.checked;
            renderTable(true);
          }
        });
      });

      const deleteButtons = tableHead.querySelectorAll('.delete-device-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const deviceId = Number(e.target.dataset.id);
          devices = devices.filter(d => d.id !== deviceId);
          renderTable(true);
        });
      });
    }

    /*
      При нажатии на "Рассчитать":
      1. Если в форме введены данные, добавляем прибор в список.
      2. Сразу выполняем пересчёт таблицы.
    */
    calculateBtn.addEventListener('click', () => {
      if (
        deviceNameInput.value.trim() !== '' ||
        usageHoursInput.value.trim() !== '' ||
        powerInput.value.trim() !== '' ||
        pricePerKwhInput.value.trim() !== ''
      ) {
        addOrUpdateDevice(false);
      } else {
        renderTable(true);
      }
    });

    /*
      При нажатии на "Добавить прибор":
      1. Добавляем прибор в список.
      2. Пересчитываем таблицу.
    */
    addDeviceBtn.addEventListener('click', () => {
      addOrUpdateDevice(false);
    });

    /*
      При нажатии на "Сбросить":
      1. Очищаем массив приборов.
      2. Сбрасываем значения формы.
      3. Скрываем таблицу.
    */
    resetBtn.addEventListener('click', () => {
      devices = [];
      deviceForm.reset();
      hoursErrorSpan.textContent = '';
      tableContainer.style.display = 'none';
    });