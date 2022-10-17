function handleStartTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  const start_time = event.formInputs['date_field_start_time'][0]['msSinceEpoch'];
  userPropertyStore.setProperty('startDate', start_time)
  console.log(`Info: Setting Start-Time to ${new Date(start_time)}`)
}

function handleEndTimeChange(event) {
  const userPropertyStore = PropertiesService.getUserProperties()
  const end_time = event.formInputs['date_field_end_time'][0]['msSinceEpoch'];
  userPropertyStore.setProperty('endDate', end_time)
  console.log(`Info: Setting End-Time to ${new Date(end_time)}`)
}

function handleDropDownChange(event) {
  console.log(event)
  const userPropertyStore = PropertiesService.getUserProperties()
  const calendar_id = event.formInputs['selected_calender'][0];
  userPropertyStore.setProperty('calendarId', calendar_id)
}

