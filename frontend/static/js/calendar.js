/* eslint-disable no-var,prefer-destructuring,prefer-template,no-undef,object-shorthand,no-console */
// for testing IE11 compatibility, this file doesn't use ES6 syntax.

function createDropdownSection() {
  console.log("createDropdownSection 실행");
  const section = document.createElement('div');
  section.className = 'toastui-calendar-popup-section toastui-calendar-dropdown-section toastui-calendar-state-section';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toastui-calendar-popup-section-item toastui-calendar-popup-button';
  button.innerHTML = `
    <span class="toastui-calendar-icon toastui-calendar-ic-user-b"></span>
    <span class="toastui-calendar-content toastui-calendar-event-state">
      <div id="id_attendees">인원</div>
    </span>
    <span class="toastui-calendar-icon toastui-calendar-ic-dropdown-arrow"></span>
  `;

  const ul = document.createElement('ul');
  ul.className = 'toastui-calendar-dropdown-menu';
  ul.id = 'id_dropdown_ul'
  ul.style.display = 'none';
//  const people = ['재민', '민제', '경주', '현정', '선복', '시나'];
  const people = ['재민', '민제', '경주', '상민', '태리', '효빈', '태림'];

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
    console.log("!@!@!", e.target.type);
    if (e.target.type === 'checkbox') {
      updateSelectedPeople();
    }
  });

  function updateSelectedPeople() {
    console.log("updateSelectedPeople 실행");
    const selectedPeople = Array.from(ul.querySelectorAll('input:checked'))
      .map(input => input.value);

    const contentDiv = document.getElementById('id_attendees');
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
        backgroundColor: '#000',
        dragBackgroundColor: '#000',
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

    if (aholidays) {
        aholidays.forEach(holiday => {
            cal.createEvents([holiday]);
        });
    }

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

    // 검색 관련 변수
    const searchInput = document.getElementById('id_search_input');
    const searchButton = document.getElementById('id_search_btn');

    let originEvents = [];
    let matchedEvents = [];
    let currentIndex = -1;
    let lastHighlightedEvent = null;
    const defaultStyle = {};  // 기본 스타일 정의
    const highlightStyle = { backgroundColor: 'yellow' };  // 하이라이트 스타일 정의

    searchButton.addEventListener('click', () => {
      const keyword = searchInput.value.toLowerCase();

      // 새로운 검색어인 경우 검색 수행
      if (keyword !== searchInput.dataset.lastKeyword) {
        // 모든 일정 가져오기
        fetch('/api/event/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          originEvents = data;
          console.log(originEvents);

          // 검색어와 일치하는 일정 필터링
          matchedEvents = originEvents.filter(event =>
            event.title.toLowerCase().includes(keyword)
          );

          console.log(matchedEvents);

          // 검색 결과 초기화
          currentIndex = -1;
          searchInput.dataset.lastKeyword = keyword;

          // 검색 결과 처리
          highlightNextEvent();
        })
        .catch(error => console.error('Error:', error));
      } else {
        // 동일 검색어로 순회
        highlightNextEvent();
      }
    });

    function highlightNextEvent() {
      if (lastHighlightedEvent) {
        cal.updateEvent(lastHighlightedEvent.id, lastHighlightedEvent.calendarId, {
          customStyle: defaultStyle
        });
      }

      // 검색 결과 처리
      if (matchedEvents.length > 0) {
        // 다음 일정으로 이동
        currentIndex = (currentIndex + 1) % matchedEvents.length;
        const nextMatch = matchedEvents[currentIndex];

        // 해당 일정으로 이동 및 팝업 열기
        cal.setDate(nextMatch.start);
        cal.updateEvent(nextMatch.id, nextMatch.calendarId, {
          customStyle: highlightStyle
        });

        // 현재 하이라이트된 이벤트 저장
        lastHighlightedEvent = nextMatch;

        // 현재 검색 결과 표시
        console.log(`검색 결과 ${currentIndex + 1}/${matchedEvents.length}`);
      } else {
        console.log('일치하는 일정이 없습니다.');
      }
    }

  }

  // 이벤트 블록에서 시간을 추출하는 함수입니다.
    function extractTimeFromEventBlock(block) {
      const timeElement = block.querySelector('.toastui-calendar-template-time strong');
      if (timeElement) {
        const timeText = timeElement.textContent.trim();
        const [hours, minutes] = timeText.split(':').map(Number);
        return new Date().setHours(hours, minutes, 0, 0); // 현재 날짜의 시간으로 반환
      }
      return new Date().setHours(0, 0, 0, -1); // 시간이 없는 경우 00:00 반환
    }

  function bindInstanceEvents() {
    cal.on({
      clickMoreEventsBtn: function (btnInfo) {
        console.log('clickMoreEventsBtn', btnInfo);
          const moreContainer = document.querySelector('.toastui-calendar-month-more-list');

          if (moreContainer) {
            // `toastui-calendar-weekday-event-block` 요소들을 가져옵니다.
            const eventBlocks = Array.from(moreContainer.querySelectorAll('.toastui-calendar-weekday-event-block'));

            // 이벤트 시작 시간을 기준으로 정렬합니다.
            eventBlocks.sort((a, b) => {
              const timeA = extractTimeFromEventBlock(a);
              const timeB = extractTimeFromEventBlock(b);
              return timeA - timeB;
            });

            // 정렬된 순서대로 요소를 다시 추가합니다.
            eventBlocks.forEach(block => moreContainer.appendChild(block));
          }
      },
      clickEvent: function (eventInfo) {
            console.log('clickEvent', eventInfo);
            // 1. Wait for the `.toastui-calendar-edit-button` to appear using a MutationObserver
            const observeButtonAppearance = new MutationObserver((mutations, observer) => {
                mutations.forEach((mutation) => {
                    const editButton = document.querySelector('.toastui-calendar-edit-button');
                    if (editButton) {
                        console.log('Edit button appeared');
                        // 2. Add click listener to the edit button
                        editButton.addEventListener('click', function () {
                            console.log('Edit button clicked');
                            // 3. Start observing the form popup slot for changes
                            const targetNode = document.querySelector('.toastui-calendar-event-form-popup-slot');
                            if (targetNode) {
                                const observer = new MutationObserver((mutations, observer) => {
                                    mutations.forEach((mutation) => {
                                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                                            const formContainer = targetNode.querySelector('.toastui-calendar-form-container');
                                            const dropdownSection = createDropdownSection();
                                            formContainer.insertBefore(dropdownSection, formContainer.firstChild);

                                            console.log("!!!!", eventInfo.event.attendees);
                                            const attendees = eventInfo.event.attendees;
                                            attendees.forEach(attendee => {
                                                const checkbox = document.querySelector(`input[value="${attendee}"]`);
                                                if (checkbox) {
                                                    checkbox.checked = true;
                                                }
                                            });

                                            // Hide the sixth div element
                                            const busy_dd = document.querySelector('.toastui-calendar-form-container > div:nth-child(6)');
                                            if (busy_dd) busy_dd.style.display = 'none';

                                            // Disconnect the observer after handling the mutation
                                            observer.disconnect();
                                        }
                                    });
                                });

                                observer.observe(targetNode, { childList: true });
                            }
                        });

                        // Once the button is found and event listener is added, disconnect the observer
                        observer.disconnect();
                    }
                });
            });

            // Start observing the DOM for the edit button
            observeButtonAppearance.observe(document.body, { childList: true, subtree: true });

            // Optionally, stop observing after a certain time to avoid unnecessary overhead
            setTimeout(() => observeButtonAppearance.disconnect(), 5000); // Disconnect after 5 seconds if not found
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
        event.color = '#000';
        const calendar = MOCK_CALENDARS.find(cal => cal.id === event.calendarId);
        if (calendar) {
          event.borderColor = calendar.borderColor;
          event.backgroundColor = calendar.bgColor;
          event.dragBackgroundColor = calendar.dragBackgroundColor;
        }
        const attendeesElement = document.querySelector('#id_attendees');
        const eventAttendees = attendeesElement ? attendeesElement.textContent.split(',').map(name => name.trim()) : [];
        event.attendees = eventAttendees;
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
        const calendar = MOCK_CALENDARS.find(cal => cal.id === changes.calendarId);
        if (calendar) {
          changes.borderColor = calendar.borderColor;
          changes.backgroundColor = calendar.bgColor;
          changes.dragBackgroundColor = calendar.dragBackgroundColor;
        }

        const ul = document.getElementById('id_dropdown_ul');
        if (ul) {
            const selectedPeople = Array.from(ul.querySelectorAll('input:checked'))
              .map(input => input.value);

            const contentDiv = document.getElementById('id_attendees');
            contentDiv.textContent = selectedPeople.length > 0
              ? `${selectedPeople.join(', ')}`
              : '';
            changes.attendees = selectedPeople;
        }


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
      popupDetailState({ state }) {
        return ''
      }
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
