function handleChangeDefaultsButton() {
  return buildCard('Choose Defaults', chooseDefaultsSection())
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
