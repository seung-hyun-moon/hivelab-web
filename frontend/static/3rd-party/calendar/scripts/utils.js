///* eslint-disable no-var,prefer-template,no-undef */
//var $ = function (selector) {
//  return document.querySelector(selector);
//};
//
//var $$ = function (selector) {
//  return Array.prototype.slice.call(document.querySelectorAll(selector));
//};
function getHolidays(year, month) {
  return new Promise((resolve) => {
    const serviceKey =
      "BMGIafb6F%2BbjVUOgBpP0KhMFt2Xo%2B35JLYUc2Eu2AX%2BE69WIN4TwkM3a2YYb3XgUSmdv1CXPYOCFaYyyhwXEgw%3D%3D"; // 실제 서비스 키로 교체하세요

    const xhr = new XMLHttpRequest();
    const url =
      "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";

    let queryParams = "?" + encodeURIComponent("serviceKey") + "=" + serviceKey;
    queryParams +=
      "&" + encodeURIComponent("solYear") + "=" + encodeURIComponent(year);
    queryParams +=
      "&" + encodeURIComponent("solMonth") + "=" + encodeURIComponent(month);

    xhr.open("GET", url + queryParams);

    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.responseText, "text/xml");
            const items = xmlDoc.getElementsByTagName("item");

            const holidays = Array.from(items).map((item) => {
              const event = {
                id: chance.guid(),
                calendarId: "99",
                title: item.getElementsByTagName("dateName")[0].textContent,
                start: item.getElementsByTagName("locdate")[0].textContent,
                end: item.getElementsByTagName("locdate")[0].textContent,
                isAllday: true,
                category: "time",
                state: "Busy",
                isVisible: true,
                isReadOnly: true,
                color: "#000",
                backgroundColor: "#000",
                dragBackgroundColor: "#000",
                borderColor: "#000",
                is_public: true,
              };

              const calendar = MOCK_CALENDARS.find(
                (cal) => cal.id === event.calendarId
              );
              if (calendar) {
                event.color = calendar.color;
                event.borderColor = calendar.borderColor;
                event.backgroundColor = calendar.bgColor;
                event.dragBackgroundColor = calendar.dragBackgroundColor;
              }

              return event;
            });

            return resolve(holidays);
          } catch (e) {
            return resolve([]); // 파싱 실패 → 빈 배열
          }
        } else {
          return resolve([]); // 요청 실패 → 빈 배열
        }
      }
    };

    xhr.onerror = () => resolve([]); // 네트워크 에러 → 빈 배열
    xhr.send();
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
