function eventFilter(eventName) {
  // Returns 'false' if the name of the event includes 'ab 12 Uhr' or 'bis 12 Uhr' or similiar things
  // Otherwise 'true
  const regex = /^.*(\s|\()(ab|bis)\s\d.*$/;
  return !regex.test(eventName)
}
