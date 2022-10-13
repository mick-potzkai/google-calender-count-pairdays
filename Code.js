// Next up: Refactor; Write chosen calender, startDate and endDate on every card; detect open fridays (and retros?)

function main() {
  const userPropertyStore = PropertiesService.getUserProperties()
  console.log(`CalendarId: ${userPropertyStore.getProperty('calendarId')}`)
  const lastDeveloperSwitchesUpdate = Number(userPropertyStore.getProperty('lastDeveloperSwitchesUpdate'))
  // TODO: validate that endDate is in the future
  if (userPropertyStore.getProperty('calendarId') && userPropertyStore.getProperty('startDate') && userPropertyStore.getProperty('endDate')) {
    if (lastDeveloperSwitchesUpdate < (+new Date()) - (24 * 60 * 60 * 1000)) {
      return buildCard('Set Developers', setDevelopersSection())
    } else {
      return buildCard('Count Pairdays', countPairdaysSection())
    }
  } else {
    return buildCard('Choose Defaults', chooseDefaultsSection())
  }
}

function buildCard(cardName, section) {
  return CardService.newCardBuilder()
      .setName(cardName)
      .addSection(section)
      .build();
}

function chooseDefaultsSection() {
  let startDate = Number(PropertiesService.getUserProperties().getProperty('startDate'))
  let endDate = Number(PropertiesService.getUserProperties().getProperty('endDate'))
  let calendarId = PropertiesService.getUserProperties().getProperty('calendarId')
  const currentDate = +new Date()
  if (!startDate || startDate < currentDate) {
    startDate = currentDate
  }
  if (!endDate || endDate < startDate) {
    console.log(`startDate: ${startDate}`)
    endDate = Number(startDate) + 3 * 24 * 60 * 60 * 1000 // 3 Tage Zeitspanne
    console.log(`endDate: ${endDate}`)
  } else {
    console.log(`endDate (${new Date(endDate)}) was larger than startDate (${new Date(startDate)})`)
  }

  const startDatePicker = CardService.newDatePicker()
      .setTitle("Start Date (exclusive)")
      .setFieldName("date_field_start_time")
      // Set default value as Jan 1, 2018 UTC. Either a number or string is acceptable.
      .setValueInMsSinceEpoch(startDate)
      .setOnChangeAction(CardService.newAction()
          .setFunctionName("handleStartTimeChange"));

  const endDatePicker = CardService.newDatePicker()
      .setTitle("End Date (exclusive)")
      .setFieldName("date_field_end_time")
      // Set default value as Jan 1, 2018 UTC. Either a number or string is acceptable.
      .setValueInMsSinceEpoch(endDate)
      .setOnChangeAction(CardService.newAction()
          .setFunctionName("handleEndTimeChange"));

  const calendars = CalendarApp.getAllCalendars();
  const calendarDropdown = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setFieldName("selected_calender")
      .setTitle("Select a Calendar")
      .setOnChangeAction(CardService.newAction()
          .setFunctionName("handleDropDownChange"))


  calendars.forEach(calendar =>
      calendarDropdown.addItem(
          calendar.getName(),
          calendar.getId(),
          calendarId ? (calendar.getId() === calendarId) : (calendar.getName() === 'Gremlins')
      ));

  const submitButton = CardService.newTextButton()
      .setText("Next ->")
      .setOnClickAction(CardService.newAction()
          .setFunctionName("handleChangeDevelopersButton"));

  return CardService.newCardSection()
      .addWidget(startDatePicker)
      .addWidget(endDatePicker)
      .addWidget(calendarDropdown)
      .addWidget(submitButton);
}

function setDevelopersSection() {
  const changeDefaultsButton = CardService.newTextButton()
      .setText("<- Change Defaults")
      .setOnClickAction(CardService.newAction()
          .setFunctionName("handleChangeDefaultsButton"));


  let startDate = Number(PropertiesService.getUserProperties().getProperty('startDate'))
  let endDate = Number(PropertiesService.getUserProperties().getProperty('endDate'))
  let calendarId = PropertiesService.getUserProperties().getProperty('calendarId')
  let developerSwitchChoicesString = PropertiesService.getUserProperties().getProperty('developerSwitchChoices')
  let developerSwitchChoices = {}

  // Get calendar object from calendarId
  const calendar = CalendarApp.getAllCalendars().filter(calendar => calendar.getId() === calendarId)[0];
  console.log(`Evaluating calendar ${calendar.getName()} in the range of ${new Date(Number(startDate))} to ${new Date(Number(endDate))}`)


  let currentDate = startDate;
  // TODO: Fix this Abbruchkriterium
  const allDevelopersDict = {};
  while (currentDate <= (endDate - 24 * 60 * 60 * 1000)) {
    currentDate += 24 * 60 * 60 * 1000  // Move one day forward; Note that the startDate is exclusive

    // get the calender events
    const events = calendar.getEventsForDay(new Date(currentDate))
    let filteredEvents = events.filter(event => event.isAllDayEvent())
    filteredEvents = filteredEvents.filter(event => eventFilter(event.getTitle()))
    filteredEvents.forEach(event => {
      console.log(`On ${new Date(currentDate)} there is an event with the title ${event.getTitle()}`)
      allDevelopersDict[event.getTitle()] = event.getId()
    })
  }


  if (developerSwitchChoicesString) {
    try {
      developerSwitchChoices = JSON.parse(developerSwitchChoicesString)
    } catch (e) {
      console.log(e)
    }
  }


  // Make Dict to Array
  let allDevelopers = Object.entries(allDevelopersDict).map((event, _) => {
    return {title: event[0], id: event[1]}
  })
  let listOfAllDevelopers = []

  const developerSwitches = allDevelopers
      .map(({title, id}) => {
        listOfAllDevelopers.push(title)
        let isSelected = Object.keys(developerSwitchChoices).includes(title) ? developerSwitchChoices[title] : false
        console.log(`Create DeveloperSwitch with name ${title} (selected = ${isSelected})`)
        return CardService.newDecoratedText()
            .setText(title)
            .setWrapText(true)
            .setSwitchControl(CardService.newSwitch()
                .setFieldName(title)
                .setValue('True')
                .setSelected(isSelected))
      });


  const nextButton = CardService.newTextButton()
      .setText("Next ->")
      .setOnClickAction(CardService.newAction()
          .setFunctionName("saveDeveloperSwitchChoices")
          .setParameters({listOfAllDevelopers: JSON.stringify(listOfAllDevelopers)}));


  let card = CardService.newCardSection()
      .addWidget(changeDefaultsButton)

  developerSwitches.forEach(developerSwitch => card.addWidget(developerSwitch))
  card.addWidget(nextButton)

  return card
}

function countPairdaysSection() {
  const changeDevelopersButton = CardService.newTextButton()
      .setText("<- Set Developers")
      .setOnClickAction(CardService.newAction()
          .setFunctionName("handleChangeDevelopersButton"));

  const pairdaysCount = countPairDaysFromProperties();

  const pairdays = CardService.newDecoratedText()
      .setText(`Pairdays: ${pairdaysCount}`);

  return CardService.newCardSection()
      .addWidget(changeDevelopersButton)
      .addWidget(pairdays)
}

function saveDeveloperSwitchChoices(event) {
  const userPropertyStore = PropertiesService.getUserProperties()

  const developerSwitchChoicesString = userPropertyStore.getProperty('developerSwitchChoices');
  let developerChoicesDict = {};
  if (developerSwitchChoicesString) {
    try {
      developerChoicesDict = JSON.parse(developerSwitchChoicesString)
    } catch (e) {
      console.log(e)
    }
  }

  let listOfChoices = Object.keys(event.formInputs)
  let listOfAllDevelopers = JSON.parse(event.parameters['listOfAllDevelopers'])

  // save a dictionary with True / False for each possible developer
  for (let dev in listOfAllDevelopers) {
    dev = listOfAllDevelopers[dev]
    developerChoicesDict[dev] = listOfChoices.includes(dev)
  }

  userPropertyStore.setProperty('developerSwitchChoices', JSON.stringify(developerChoicesDict))
  userPropertyStore.setProperty('lastDeveloperSwitchesUpdate', (+new Date()).toString())


  return main()
}

function handleStartTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  var start_time = event.formInputs['date_field_start_time'][0]['msSinceEpoch']
  userPropertyStore.setProperty('startDate', start_time)
}

function handleEndTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  var end_time = event.formInputs['date_field_end_time'][0]['msSinceEpoch']
  userPropertyStore.setProperty('endDate', end_time)
}

function handleDropDownChange(event) {
  console.log(event)
  const userPropertyStore = PropertiesService.getUserProperties()
  var calendar_id = event.formInputs['selected_calender'][0]
  userPropertyStore.setProperty('calendarId', calendar_id)
}

function handleChangeDefaultsButton() {
  return buildCard('Choose Defaults', chooseDefaultsSection())
}

function handleChangeDevelopersButton() {
  return buildCard('Set Developers', setDevelopersSection())
}


function eventFilter(eventName) {
  // Returns 'false' if the name of the event includes 'ab 12 Uhr' or 'bis 12 Uhr' or similiar things
  // Otherwise 'true
  var regex = /^.*(\s|\()(ab|bis)\s\d.*$/
  return !regex.test(eventName)
}

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
        if (date1.getDate() < date2.getDate()) {
          return true
        } else {
          return false
        }
      }
    }
  }

  const calendar = CalendarApp.getCalendarById(calendarId);
  var currentTime = startTime + 24 * 60 * 60 * 1000
  var totalPairDays = 0

  while (isBefore(new Date(currentTime), new Date(endTime))) {
    var dailyPairDays = calendar.getEventsForDay(new Date(currentTime))
        .filter(event => event.isAllDayEvent())
        .filter(event => (developerChoicesDict[event.getTitle()] ?? false))
        .length

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
  var calendarId = userPropertyStore.getProperty('calendarId')
  var startTime = Number(userPropertyStore.getProperty('startDate'))
  var endTime = Number(userPropertyStore.getProperty('endDate'))

  var developerSwitchChoicesString = userPropertyStore.getProperty('developerSwitchChoices')
  var developerChoicesDict = {}
  if (developerSwitchChoicesString) {
    try {
      developerChoicesDict = JSON.parse(developerSwitchChoicesString)
    } catch (e) {
      console.log(e)
    }
  }

  return countPairDays(calendarId, startTime, endTime, developerChoicesDict)
}