function countPairDays(calendarId, startTime, endTime, developerChoicesDict) {
  function isBefore(date1, date2) {
    if (date1.getYear() < date2.getYear()) {
      return true
    } else if (date1.getYear() > date2.getYear()) {
      return false
    } else {
      if (date1.getMonth() < date2.getMonth()) {
        return true
      } else if (date1.getMonth() > date2.getMonth()) {
        return false
      } else {
        return date1.getDate() < date2.getDate();
      }
    }
  }

  const calendar = CalendarApp.getCalendarById(calendarId);
  let currentTime = startTime + 24 * 60 * 60 * 1000;
  let totalPairDays = 0;

  while (isBefore(new Date(currentTime), new Date(endTime))) {
    let dailyPairDays = calendar.getEventsForDay(new Date(currentTime))
        .filter(event => event.isAllDayEvent())
        .filter(event => (developerChoicesDict[event.getTitle()] ?? false))
        .length;

    dailyPairDays = Math.floor(dailyPairDays / 2)

    console.log(`Info: Found ${dailyPairDays} Pairs on day ${(new Date(currentTime)).toDateString()}.`)
    totalPairDays += dailyPairDays
    currentTime += 24 * 60 * 60 * 1000
  }
  console.log(`Info: Found a total of ${totalPairDays}.`)
  return totalPairDays
}

function countPairDaysFromProperties() {
  const userPropertyStore = PropertiesService.getUserProperties()
  const calendarId = userPropertyStore.getProperty('calendarId');
  const startTime = Number(userPropertyStore.getProperty('startDate'));
  const endTime = Number(userPropertyStore.getProperty('endDate'));

  const developerSwitchChoicesString = userPropertyStore.getProperty('developerSwitchChoices');
  let developerChoicesDict = {};
  if (developerSwitchChoicesString) {
    try {
      developerChoicesDict = JSON.parse(developerSwitchChoicesString)
    } catch (e) {
      console.log(e)
    }
  }

  return countPairDays(calendarId, startTime, endTime, developerChoicesDict)
}
