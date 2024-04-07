import { camelToKebab } from "../utils/string-util";

const removeConditionElement = (elList: Array<HTMLElement>) => {
  let isNextStepRemoved = false;

  if (!elList) return;

  elList.forEach((el: HTMLElement) => {
    const ifCondition = el.dataset["vIf"];
    const ifElseIfCondition = el.dataset["vElseIf"];
    // const ifElseCondition = el.dataset["vElse"];
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
const searchNextConditionElement = (el: HTMLElement) => {
  let nextEl: HTMLElement = el;
  let elList: Array<HTMLElement> = [nextEl];

  do {
    nextEl = nextEl.nextElementSibling as HTMLElement;
    if (nextEl) {
      elList.push(nextEl);
    }
  } while (nextEl && nextEl.dataset["vElseIf" || "vElse"]);

  removeConditionElement(elList);
  elList = null;
};

export const conditionStatementParser = (doc: HTMLElement) => {
  const container = doc;
  const elements = doc.querySelectorAll("[data-v-if]");
  elements.forEach((el: HTMLElement) => searchNextConditionElement(el));

  return container;
};
