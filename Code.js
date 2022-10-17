// Next up: Fix Header; Write chosen calendar, startDate and endDate on every card; detect open fridays (and retros?); save developerChoices onChange

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
  var cardHeader = CardService.newCardHeader()
      .setTitle("Card header title")
      .setSubtitle("Card header subtitle")
      .setImageStyle(CardService.ImageStyle.CIRCLE)
      .setImageUrl("https://image.png");

  return CardService.newCardBuilder()
      .setName(cardName)
      .setHeader(cardHeader)
      .addSection(section)
      .build();
}