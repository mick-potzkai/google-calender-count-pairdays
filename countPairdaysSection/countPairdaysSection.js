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

