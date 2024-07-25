/* eslint-disable no-var,prefer-destructuring,prefer-template,no-undef,object-shorthand,no-console */
// for testing IE11 compatibility, this file doesn't use ES6 syntax.

function createDropdownSection() {
  const section = document.createElement('div');
  section.className = 'toastui-calendar-popup-section toastui-calendar-dropdown-section toastui-calendar-state-section';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toastui-calendar-popup-section-item toastui-calendar-popup-button';
  button.innerHTML = `
    <span class="toastui-calendar-icon toastui-calendar-ic-user-b"></span>
    <span class="toastui-calendar-content toastui-calendar-event-state">
      <div>인원</div>
    </span>
    <span class="toastui-calendar-icon toastui-calendar-ic-dropdown-arrow"></span>
  `;

  const ul = document.createElement('ul');
  ul.className = 'toastui-calendar-dropdown-menu';
  ul.style.display = 'none';
  const people = ['재민', '민제', '경주', '현정', '선복', '시나'];

  people.forEach(person => {
    const li = document.createElement('li');
    li.className = 'toastui-calendar-popup-section-item toastui-calendar-dropdown-menu-item';
    li.innerHTML = `
      <input type="checkbox" id="${person}" name="person" value="${person}" style="display:none;">
      <label for="${person}" style="width:70px;height:32px;cursor: pointer;" class="person-label toastui-calendar-content">${person}</label>
    `;
    ul.appendChild(li);
  });

  section.appendChild(button);
  section.appendChild(ul);

  // 드롭다운 토글 기능
  button.addEventListener('click', () => {
    event.stopPropagation();
    ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
  });

  // 체크박스 변경 이벤트 처리
  ul.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      updateSelectedPeople();
    }
  });

  function updateSelectedPeople() {
    const selectedPeople = Array.from(ul.querySelectorAll('input:checked'))
      .map(input => input.value);

    const contentDiv = button.querySelector('.toastui-calendar-event-state div');
    contentDiv.id = 'id_attendees';
    contentDiv.textContent = selectedPeople.length > 0
      ? `${selectedPeople.join(', ')}`
      : '';
  }

  // 드롭다운 외부 클릭 시 드롭다운을 닫기 위한 이벤트 리스너 추가
  document.addEventListener('click', (event) => {
    if (!section.contains(event.target)) {
      ul.style.display = 'none';
    }
  });

  return section;
}

function transformEvent(event) {
    const defaultValues = {
        id: '',
        calendarId: '',
        title: '',
        body: '',
        isAllday: false,
        goingDuration: 0,
        comingDuration: 0,
        location: '',
        attendees: [],
        category: 'time',
        dueDateClass: '',
        recurrenceRule: '',
        state: 'Busy',
        isVisible: true,
        isPending: false,
        isFocused: false,
        isReadOnly: false,
        isPrivate: false,
        color: '#000',
        backgroundColor: '#a1b56c',
        dragBackgroundColor: '#a1b56c',
        borderColor: '#000',
        customStyle: {},
        raw: null
    };

    // Merge default values with the provided event
    event = Object.assign({}, defaultValues, event);

    // Convert isAllday to string
    event.isAllday = JSON.parse(event.isAllday);

    // Convert start and end to ISO strings
    event.start = moment(event.start.d.d).toISOString();
    event.end = moment(event.end.d.d).toISOString();

    return event;
}

function updateJSON(largeObj, smallObj) {
  // Object.keys()를 사용하여 smallObj의 모든 키를 가져옵니다
  Object.keys(smallObj).forEach(key => {
    // largeObj에 해당 키가 있는지 확인합니다
    if (largeObj.hasOwnProperty(key)) {
      // 키가 있다면, largeObj의 값을 smallObj의 값으로 업데이트합니다
      largeObj[key] = smallObj[key];
    }
  });

  // 업데이트된 largeObj를 반환합니다
  return largeObj;
}

(function (Calendar) {
  var cal;
  // Constants
  var CALENDAR_CSS_PREFIX = 'toastui-calendar-';
  var cls = function (className) {
    return CALENDAR_CSS_PREFIX + className;
  };

  // Elements
  var navbarRange = document.querySelector('.navbar--range');
  var prevButton = document.querySelector('.prev');
  var nextButton = document.querySelector('.next');
  var todayButton = document.querySelector('.today');
  var dropdown = document.querySelector('.dropdown');
  var dropdownTrigger = document.querySelector('.dropdown-trigger');
  var dropdownTriggerIcon = document.querySelector('.dropdown-icon');
  var dropdownContent = document.querySelector('.dropdown-content');
  var checkboxCollapse = document.querySelector('.checkbox-collapse');
  var sidebar = document.querySelector('.sidebar');

  // App State
  var appState = {
    activeCalendarIds: MOCK_CALENDARS.map(function (calendar) {
      return calendar.id;
    }),
    isDropdownActive: false,
  };

  // functions to handle calendar behaviors
  async function reloadEvents(holidays) {
    var randomEvents;

    cal.clear();

//    cal.createEvents(holidays);
    var aholidays = await holidays;
    // 모든 Promise가 해결된 후 결과를 반복하여 TUI Calendar에 추가
    aholidays.forEach(holiday => {
        console.log(holiday);
        cal.createEvents([holiday]);
    });

    fetch('/api/event/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Fetched events:', data);
        data.forEach(event => {
            event.start = moment(event.start).toDate();
            event.end = moment(event.end).toDate();
        });
        cal.createEvents(data);
    })
    .catch(error => console.error('Error:', error));


//    randomEvents = generateRandomEvents(
//      cal.getViewName(),
//      cal.getDateRangeStart(),
//      cal.getDateRangeEnd()
//    );
//    console.log(randomEvents);
//    cal.createEvents(randomEvents);
  }

  function getReadableViewName(viewType) {
    switch (viewType) {
      case 'month':
        return '월별';
      case 'week':
        return '주별';
      case 'day':
        return '일별';
      default:
        throw new Error('no view type');
    }
  }

  function displayRenderRange() {
    var rangeStart = cal.getDateRangeStart();
    var rangeEnd = cal.getDateRangeEnd();
    var holidays;
    [navbarRange.textContent, holidays] = getNavbarRange(rangeStart, rangeEnd, cal.getViewName());
    return holidays;
  }

  function setDropdownTriggerText() {
    var viewName = cal.getViewName();
    var buttonText = document.querySelector('.dropdown .button-text');
    buttonText.textContent = getReadableViewName(viewName);
  }

  function toggleDropdownState() {
    appState.isDropdownActive = !appState.isDropdownActive;
    dropdown.classList.toggle('is-active', appState.isDropdownActive);
    dropdownTriggerIcon.classList.toggle(cls('open'), appState.isDropdownActive);
  }

  function setAllCheckboxes(checked) {
    var checkboxes = Array.prototype.slice.call(document.querySelectorAll('.sidebar-item > input[type="checkbox"]'));

    checkboxes.forEach(function (checkbox) {
      checkbox.checked = checked;
      setCheckboxBackgroundColor(checkbox);
    });
  }

  function setCheckboxBackgroundColor(checkbox) {
    var calendarId = checkbox.value;
    var label = checkbox.nextElementSibling;
    var calendarInfo = MOCK_CALENDARS.find(function (calendar) {
      return calendar.id === calendarId;
    });

    if (!calendarInfo) {
      calendarInfo = {
        backgroundColor: '#2a4fa7',
      };
    }

    label.style.setProperty(
      '--checkbox-' + calendarId,
      checkbox.checked ? calendarInfo.backgroundColor : '#fff'
    );
  }

  function update() {
    setDropdownTriggerText();
    const holidays = displayRenderRange();
    reloadEvents(holidays);
  }

  function bindAppEvents() {
    dropdownTrigger.addEventListener('click', toggleDropdownState);

    prevButton.addEventListener('click', function () {
      cal.prev();
      update();
    });

    nextButton.addEventListener('click', function () {
      cal.next();
      update();
    });

    todayButton.addEventListener('click', function () {
      cal.today();
      update();
    });

    dropdownContent.addEventListener('click', function (e) {
      var targetViewName;

      if ('viewName' in e.target.dataset) {
        targetViewName = e.target.dataset.viewName;
        cal.changeView(targetViewName);
        checkboxCollapse.disabled = targetViewName === 'month';
        toggleDropdownState();
        update();
      }
    });

    checkboxCollapse.addEventListener('change', function (e) {
      if ('checked' in e.target) {
        cal.setOptions({
          week: {
            collapseDuplicateEvents: !!e.target.checked,
          },
          useDetailPopup: !e.target.checked,
        });
      }
    });

    sidebar.addEventListener('click', function (e) {
      if ('value' in e.target) {
        if (e.target.value === 'all') {
          if (appState.activeCalendarIds.length > 0) {
            cal.setCalendarVisibility(appState.activeCalendarIds, false);
            appState.activeCalendarIds = [];
            setAllCheckboxes(false);
          } else {
            appState.activeCalendarIds = MOCK_CALENDARS.map(function (calendar) {
              return calendar.id;
            });
            cal.setCalendarVisibility(appState.activeCalendarIds, true);
            setAllCheckboxes(true);
          }
        } else if (appState.activeCalendarIds.indexOf(e.target.value) > -1) {
          appState.activeCalendarIds.splice(appState.activeCalendarIds.indexOf(e.target.value), 1);
          cal.setCalendarVisibility(e.target.value, false);
          setCheckboxBackgroundColor(e.target);
        } else {
          appState.activeCalendarIds.push(e.target.value);
          cal.setCalendarVisibility(e.target.value, true);
          setCheckboxBackgroundColor(e.target);
        }
      }
    });
  }

  function bindInstanceEvents() {
    cal.on({
      clickMoreEventsBtn: function (btnInfo) {
        console.log('clickMoreEventsBtn', btnInfo);
      },
      clickEvent: function (eventInfo) {
        console.log('clickEvent', eventInfo);
      },
      clickDayName: function (dayNameInfo) {
        console.log('clickDayName', dayNameInfo);
      },
      selectDateTime: function (dateTimeInfo) {
        console.log('selectDateTime', dateTimeInfo);
        // MutationObserver를 사용하여 DOM 변경을 감지합니다.
        const targetNode = document.querySelector('.toastui-calendar-event-form-popup-slot');
        if (targetNode) {
          const observer = new MutationObserver((mutations, observer) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const formContainer = targetNode.querySelector('.toastui-calendar-form-container');

                  const dropdownSection = createDropdownSection();
                  formContainer.insertBefore(dropdownSection, formContainer.firstChild);

                // 한 번 감지하면 더 이상 관찰하지 않도록 종료합니다.
                const busy_dd = document.querySelector('.toastui-calendar-form-container > div:nth-child(6)');
                busy_dd.style.display='none';

                observer.disconnect();
              }
            });
          });

          // 해당 요소의 자식 노드 변화를 관찰합니다.
          observer.observe(targetNode, { childList: true });
        }
      },
      beforeCreateEvent: function (event) {
        console.log('beforeCreateEvent', event);
        event.id = chance.guid();
        event.category = 'time';
        event.color = '#a1b56c';
        const calendar = MOCK_CALENDARS.find(cal => cal.id === event.calendarId);
        if (calendar) {
          event.borderColor = calendar.borderColor;
          event.backgroundColor = calendar.bgColor;
          event.dragBackgroundColor = calendar.dragBackgroundColor;
        }
        const attendeesElement = document.querySelector('#id_attendees');
        const eventAttendees = attendeesElement ? attendeesElement.textContent.split(',').map(name => name.trim()) : [];
        const transformedEvent = transformEvent(event);
        fetch('/api/event/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transformedEvent)
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

        cal.createEvents([event]);
        cal.clearGridSelections();
      },
      beforeUpdateEvent: function (eventInfo) {
        var event, changes;

        console.log('beforeUpdateEvent', eventInfo);

        event = eventInfo.event;
        changes = eventInfo.changes;

        fetch('/api/event/'+event.id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transformEvent(updateJSON(event, changes)))
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

        cal.updateEvent(event.id, event.calendarId, changes);
      },
      beforeDeleteEvent: function (eventInfo) {
        console.log('beforeDeleteEvent', eventInfo);
        fetch('/api/event/'+eventInfo.id, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

        cal.deleteEvent(eventInfo.id, eventInfo.calendarId);
      },
    });
  }

  function initCheckbox() {
    var checkboxes = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"]'));

    checkboxes.forEach(function (checkbox) {
      setCheckboxBackgroundColor(checkbox);
    });
  }

  function getEventTemplate(event, isAllday) {
    var html = [];
    var start = moment(event.start.toDate().toUTCString());
    if (!event.isAllday) {
      html.push('<strong>' + start.format('HH:mm') + '</strong> ');
    }

    if (event.isPrivate) {
      html.push('<span class="calendar-font-icon ic-lock-b"></span>');
      html.push(' Private');
    } else {
      if (event.recurrenceRule) {
        html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
      } else if (event.attendees.length > 0) {
        html.push('<span class="calendar-font-icon ic-user-b"></span>');
      } else if (event.location) {
        html.push('<span class="calendar-font-icon ic-location-b"></span>');
      }
      html.push(' ' + event.title);
    }

    return html.join('');
  }

  // Calendar instance with options
  // eslint-disable-next-line no-undef
  cal = new Calendar('#app', {
    usageStatistics: false,
    calendars: MOCK_CALENDARS,
    defaultView: 'month',
    useFormPopup: true,
    useDetailPopup: true,
    popupDetailAttendees: true,
    eventFilter: function (event) {
      var currentView = cal.getViewName();
      if (currentView === 'month') {
        return ['allday', 'time'].includes(event.category) && event.isVisible;
      }

      return event.isVisible;
    },
    template: {
      allday: function (event) {
        return getEventTemplate(event, true);
      },
      time: function (event) {
        return getEventTemplate(event, false);
      },
      popupUpdate() {
        return '반영';
      },
      popupEdit() {
        return '수정';
      },
      popupDelete() {
        return '삭제';
      },
      popupSave() {
        return '추가';
      },
      locationPlaceholder() {
        return '위치';
      },
      popupIsAllday() {
        return '종일';
      },
      titlePlaceholder() {
        return '제목';
      },
    },
  });

  cal.setTheme({
      common: {
        saturday: {
          color: 'rgba(64, 64, 255)',
        },
      },
    });

  // Init
  bindInstanceEvents();
  bindAppEvents();
  initCheckbox();
  update();
})(tui.Calendar);
