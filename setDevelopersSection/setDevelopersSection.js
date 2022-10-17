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
  console.log(`Info: Evaluating calendar ${calendar.getName()} in the range of ${new Date(Number(startDate))} to ${new Date(Number(endDate))}`)


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
      .map(({title}) => {
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
