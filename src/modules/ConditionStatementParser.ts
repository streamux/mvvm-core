const removeConditionElement = (elList) => {
  let isNextStepRemoved = false;

  if (!elList) return;

  let count = 1;

  elList.forEach((el) => {
    const ifCondition = el.dataset["vIf"];
    const ifElseIfCondition = el.dataset["vElseIf"];
    const ifElseCondition = el.dataset["vElse"];
    const condition = ifCondition || ifElseIfCondition;

    if (condition === "false" || isNextStepRemoved === true) {
      el.remove();
    } else if (condition === "true") {
      isNextStepRemoved = true;
    }

    // remove dummy prop not to need
    const datasets = el.dataset;
    const conditionPattern = /^vif|velseif|velse/i;

    Object.entries(datasets).forEach(([key, value]) => {
      if (conditionPattern.test(key))
        el.removeAttribute("data-" + camelToKebab(key));
    });
  });

  // console.log('----------------------');
};

// search element
const searchNextConditionElement = (el) => {
  let nextEl = el;
  let elList = [nextEl];

  do {
    nextEl = nextEl.nextElementSibling;
    if (nextEl) {
      elList.push(nextEl);
    }
  } while (nextEl && nextEl.dataset["vElseIf" || "vElse"]);

  removeConditionElement(elList);
  elList = null;
};

export const conditionStatementParser = (doc) => {
  const container = doc;
  const elements = doc.querySelectorAll("[data-v-if]");
  elements.forEach((el) => searchNextConditionElement(el));

  return container;
};
