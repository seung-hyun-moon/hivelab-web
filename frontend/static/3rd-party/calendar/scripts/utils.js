///* eslint-disable no-var,prefer-template,no-undef */
//var $ = function (selector) {
//  return document.querySelector(selector);
//};
//
//var $$ = function (selector) {
//  return Array.prototype.slice.call(document.querySelectorAll(selector));
//};
function getHolidays(year, month) {
  return new Promise((resolve, reject) => {
    const serviceKey = 'BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D'; // 실제 서비스 키로 교체하세요
    const xhr = new XMLHttpRequest();
    const url = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
    var queryParams = '?' + encodeURIComponent('serviceKey') + '=' + serviceKey;
    queryParams += '&' + encodeURIComponent('solYear') + '=' + encodeURIComponent(year);
    queryParams += '&' + encodeURIComponent('solMonth') + '=' + encodeURIComponent(month);

    xhr.open('GET', url + queryParams);
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(this.responseText, "text/xml");
          const items = xmlDoc.getElementsByTagName("item");
          const holidays = Array.from(items).map(item => {
            const defaultValues = {
              id: '',
              calendarId: '99',
              title: '',
              body: '',
              isAllday: true,
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

            const event = {
              ...defaultValues,
              id: chance.guid(),
              title: item.getElementsByTagName("dateName")[0].textContent,
              start: item.getElementsByTagName("locdate")[0].textContent,
              end: item.getElementsByTagName("locdate")[0].textContent,
            };
            const calendar = MOCK_CALENDARS.find(cal => cal.id === event.calendarId);
            if (calendar) {
              event.borderColor = calendar.borderColor;
              event.backgroundColor = calendar.bgColor;
              event.dragBackgroundColor = calendar.dragBackgroundColor;
            }
            return event;
          });
          resolve(holidays);
        } else {
          reject(new Error('Failed to fetch holidays'));
        }
      }
    };

    xhr.send('');
  });
}

function getNavbarRange(tzStart, tzEnd, viewType) {
  var start = tzStart.toDate();
  var end = tzEnd.toDate();
  var middle;
  if (viewType === 'month') {
    middle = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
    const holidays = getHolidays(moment(middle).format('YYYY'), moment(middle).format('MM'));
    return [moment(middle).format('YYYY-MM'), holidays];
  }
  if (viewType === 'day') {
    const holidays = getHolidays(moment(middle).format('YYYY'), moment(middle).format('MM'));
    return [moment(start).format('YYYY-MM-DD'), holidays];
  }
  if (viewType === 'week') {
    const holidays = getHolidays(moment(middle).format('YYYY'), moment(middle).format('MM'));
    return [moment(start).format('YYYY-MM-DD') + ' ~ ' + moment(end).format('YYYY-MM-DD')];
  }
  throw new Error('no view type');
}
