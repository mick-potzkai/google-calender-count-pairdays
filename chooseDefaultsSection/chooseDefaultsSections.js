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
