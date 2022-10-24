// Next up: Detect open fridays (and retros?); save developerChoices onChange

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
  const cardHeader = createHeader();

  return CardService.newCardBuilder()
      .setName(cardName)
      .setHeader(cardHeader)
      .addSection(section)
      .build();
}

function createHeader() {
  const userPropertyStore = PropertiesService.getUserProperties()
  let startDate = Number(userPropertyStore.getProperty('startDate'))
  let endDate = Number(userPropertyStore.getProperty('endDate'))
  let calendarId = userPropertyStore.getProperty('calendarId')
  let calendarName = CalendarApp.getCalendarById(calendarId).getName()

  const dateStringOptions = {weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit'};
  return CardService.newCardHeader()
      //.setTitle("Your beloved pairdays counter")
      .setTitle(`${calendarName}`)
      .setSubtitle(`${new Date(startDate).toLocaleDateString('de-DE', dateStringOptions)} - ${new Date(endDate).toLocaleDateString('de-DE', dateStringOptions)}`)
}