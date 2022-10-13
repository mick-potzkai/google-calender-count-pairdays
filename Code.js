// Next up: Refactor; Write choosen calender, startdate and enddate on every card; detect open fridays (and retros?)

function main() {
  const userPropertyStore = PropertiesService.getUserProperties()
  console.log(`CalendarId: ${userPropertyStore.getProperty('calendarId')}`)
  const lastdeveloperSwitchesUpdate = Number(userPropertyStore.getProperty('lastdeveloperSwitchesUpdate'))
  // TODO: validate that enddate is in the future
  if (userPropertyStore.getProperty('calendarId') && userPropertyStore.getProperty('startdate') && userPropertyStore.getProperty('enddate')) {
    if (lastdeveloperSwitchesUpdate < (+new Date()) - (24 * 60 * 60 * 1000)) {
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

function chooseDefaultsSection(){
  let startdate = Number(PropertiesService.getUserProperties().getProperty('startdate'))
  let enddate = Number(PropertiesService.getUserProperties().getProperty('enddate'))
  let calendarId = PropertiesService.getUserProperties().getProperty('calendarId')
  const currentdate = +new Date()
  if (!startdate || startdate < currentdate) {
    startdate = currentdate
  }
  if (!enddate || enddate < startdate) {
    console.log(`startdate: ${startdate}`)
    enddate = Number(startdate) + 3 * 24 * 60 * 60 * 1000 // 3 Tage Zeitspanne
    console.log(`enddate: ${enddate}`)
  } else {
    console.log(`enddate (${new Date(enddate)}) was larger than startdate (${new Date(startdate)})`)
  }

  var startDatePicker = CardService.newDatePicker()
    .setTitle("Start Date (exclusive)")
    .setFieldName("date_field_start_time")
    // Set default value as Jan 1, 2018 UTC. Either a number or string is acceptable.
    .setValueInMsSinceEpoch(startdate)
    .setOnChangeAction(CardService.newAction()
        .setFunctionName("handleStartTimeChange"));

  var endDatePicker = CardService.newDatePicker()
    .setTitle("End Date (exclusive)")
    .setFieldName("date_field_end_time")
    // Set default value as Jan 1, 2018 UTC. Either a number or string is acceptable.
    .setValueInMsSinceEpoch(enddate)
    .setOnChangeAction(CardService.newAction()
        .setFunctionName("handleEndTimeChange"));

  var calendars = CalendarApp.getAllCalendars()
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

  var submitButton = CardService.newTextButton()
    .setText("Next ->")
    .setOnClickAction(CardService.newAction()
      .setFunctionName("handleChangeDevelopersButton"))

  const defaultsSection = CardService.newCardSection()
    .addWidget(startDatePicker)
    .addWidget(endDatePicker)
    .addWidget(calendarDropdown)
    .addWidget(submitButton)

  return defaultsSection;
}

function setDevelopersSection(){
  var changeDefaultsButton = CardService.newTextButton()
    .setText("<- Change Defaults")
    .setOnClickAction(CardService.newAction()
      .setFunctionName("handleChangeDefaultsButton"))


  let startdate = Number(PropertiesService.getUserProperties().getProperty('startdate'))
  let enddate = Number(PropertiesService.getUserProperties().getProperty('enddate'))
  let calendarId = PropertiesService.getUserProperties().getProperty('calendarId')
  let developerSwitchChoicesString = PropertiesService.getUserProperties().getProperty('developerSwitchChoices')
  let developerSwitchChoices = {}

  // Get calendar object from calendarId
  var calendar = CalendarApp.getAllCalendars().filter(calendar => calendar.getId() === calendarId)[0]
  console.log(`Evaluating calendar ${calendar.getTitle()} in the range of ${new Date(Number(startdate))} to ${new Date(Number(enddate))}`)


  var currentdate = startdate
  // TODO: Fix this Abbruchkriterium
  var allDevelopersDict = {}
  while (currentdate <= (enddate - 24 * 60  * 60 * 1000)) {
    currentdate += 24 * 60  * 60 * 1000  // Move one day forward; Note that the startdate is exclusive
    
    // get the calender events
    events = calendar.getEventsForDay(new Date(currentdate))
    filteredEvents = events.filter(event => event.isAllDayEvent())
    filteredEvents = filteredEvents.filter(event => eventFilter(event.getTitle()))
    filteredEvents.forEach(event => {
      console.log(`On ${new Date(currentdate)} there is an event with the title ${event.getTitle()}`)
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
  allDevelopers = Object.entries(allDevelopersDict).map((event, _) => {return {title: event[0], id: event[1]}})
  listOfAllDevelopers = []

  var developerSwitches  = allDevelopers
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
    })

  
  var nextButton = CardService.newTextButton()
    .setText("Next ->")
    .setOnClickAction(CardService.newAction()
      .setFunctionName("saveDeveloperSwitchChoices")
      .setParameters({ listOfAllDevelopers: JSON.stringify(listOfAllDevelopers)}))
  

  card = CardService.newCardSection()
    .addWidget(changeDefaultsButton)

  developerSwitches.forEach(developerSwitch => card.addWidget(developerSwitch))
  card.addWidget(nextButton)

  return card
}

function countPairdaysSection() {
  var changeDevelopersButton = CardService.newTextButton()
    .setText("<- Set Developers")
    .setOnClickAction(CardService.newAction()
      .setFunctionName("handleChangeDevelopersButton"))

  var pairdayscount = countPairDaysFromProperties()

  var pairdays = CardService.newDecoratedText()
    .setText(`Pairdays: ${pairdayscount}`)

  return CardService.newCardSection()
      .addWidget(changeDevelopersButton)
      .addWidget(pairdays)
}

function saveDeveloperSwitchChoices(event) {
  const userPropertyStore = PropertiesService.getUserProperties()

  var developerSwitchChoicesString = userPropertyStore.getProperty('developerSwitchChoices')
  var developerChoicesDict = {}
  if (developerSwitchChoicesString) {
    try {
        developerChoicesDict = JSON.parse(developerSwitchChoicesString)
    } catch (e) {
        console.log(e)
    }
  }

  listOfChoices = Object.keys(event.formInputs)
  listOfAllDevelopers = JSON.parse(event.parameters['listOfAllDevelopers'])

  // save a dictionary with True / False for each possible developer
  for (dev in listOfAllDevelopers) {
    dev = listOfAllDevelopers[dev]
    developerChoicesDict[dev] = listOfChoices.includes(dev)
  }

  userPropertyStore.setProperty('developerSwitchChoices', JSON.stringify(developerChoicesDict))
  userPropertyStore.setProperty('lastdeveloperSwitchesUpdate', +new Date())


  return main()
}

function handleStartTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  var start_time = event.formInputs['date_field_start_time'][0]['msSinceEpoch']
  userPropertyStore.setProperty('startdate', start_time)
}

function handleEndTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  var end_time = event.formInputs['date_field_end_time'][0]['msSinceEpoch']
  userPropertyStore.setProperty('enddate', end_time)
}

function handleDropDownChange(event) {
  console.log(event)
  const userPropertyStore = PropertiesService.getUserProperties()
  var calendar_id = event.formInputs['selected_calender'][0]
  userPropertyStore.setProperty('calendarId', calendar_id)
}

function handleChangeDefaultsButton(){
  return buildCard('Choose Defaults', chooseDefaultsSection())
}

function handleChangeDevelopersButton(){
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

  var calendar = CalendarApp.getCalendarById(calendarId)
  var currentTime = startTime + 24 * 60 * 60 * 1000
  var totalPairDays = 0

  while (isBefore(new Date(currentTime), new Date(endTime))) {
    var dailyPairDays = calendar.getEventsForDay(new Date(currentTime))
      .filter(event => (developerChoicesDict[event.getTitle()] ?? false))
      .length

    dailyPairDays = Math.floor(dailyPairDays/2)

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
  var startTime = Number(userPropertyStore.getProperty('startdate'))
  var endTime = Number(userPropertyStore.getProperty('enddate'))
  
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