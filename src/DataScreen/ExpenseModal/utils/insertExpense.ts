import categories from "../../../readonlyStores/categories";
import sources from "../../../readonlyStores/sources";
import Currency from "../../../models/Currency";
import Expense from "../../../models/Expense";
import expenseStore from "../../../stores/expenseStore";
import expenseModalStore from "../../expenseModalStore";
import { ValidatedFormValues } from "../models";
import generatePersonalExpenseName from "./generatePersonalExpenseName";

export default function insertExpense(values: ValidatedFormValues): Expense {
  const newExpense = new Expense(
    -1,
    parseFloat(values.cost),
    values.currency,
    values.date!,
    categories.getByName(values.category),
    values.name,
    null,
    values.source !== null ? sources.getById(values.source) : null
  );
  // if we are editing the expense
  if (expenseModalStore.expenseId) {
    newExpense.id = expenseModalStore.expenseId;
    const modifyingExpense = expenseStore.getById(expenseModalStore.expenseId);
    if (!modifyingExpense) {
      throw new Error(
        `Can't change the expense with id '${expenseModalStore.expenseId}'`
      );
    }
    // if there are personal expenses
    if (values.personalExpCategoryId !== null) {
      // if there were personal expenses in the modifying expense
      if (modifyingExpense.personalExpense) {
        const modifyingPe = modifyingExpense.personalExpense;
        // if the personal expenses didn't change
        if (
          modifyingPe.category.id === values.personalExpCategoryId &&
          modifyingPe.cost?.toString() === values.personalExpSpent
        ) {
          newExpense.personalExpense = modifyingPe;
          newExpense.cost = (newExpense.cost || 0) - (modifyingPe.cost || 0);
        } else {
          const personalExpense = new Expense(
            modifyingPe.id,
            parseFloat(values.personalExpSpent),
            modifyingPe.currency,
            modifyingPe.date,
            categories.getById(values.personalExpCategoryId),
            generatePersonalExpenseName({
              category: values.category,
              name: values.name,
            }),
            null
          );
          expenseStore.modify(personalExpense);
          newExpense.personalExpense = personalExpense;
          newExpense.cost =
            (newExpense.cost || 0) - (personalExpense.cost || 0);
        }
      } else {
        const personalExpense = new Expense(
          -1,
          parseFloat(values.personalExpSpent),
          Currency.Eur,
          values.date!,
          categories.getById(values.personalExpCategoryId),
          generatePersonalExpenseName({
            category: values.category,
            name: values.name,
          }),
          null
        );
        expenseStore.add(personalExpense);
        newExpense.personalExpense = personalExpense;
        newExpense.cost = (newExpense.cost || 0) - (personalExpense.cost || 0);
      }
      expenseStore.modify(newExpense);
    } else {
      if (modifyingExpense.personalExpense) {
        const { id: peId } = modifyingExpense.personalExpense;
        newExpense.personalExpense = null;
        expenseStore.modify(newExpense, () => {
          expenseStore.delete(peId);
        });
      } else {
        expenseStore.modify(newExpense);
      }
    }
  } else {
    if (values.personalExpCategoryId !== null) {
      const personalExpense = new Expense(
        -1,
        parseFloat(values.personalExpSpent),
        Currency.Eur,
        values.date!,
        categories.getById(values.personalExpCategoryId),
        generatePersonalExpenseName({
          category: values.category,
          name: values.name,
        }),
        null
      );
      expenseStore.add(personalExpense);
      newExpense.cost = (newExpense.cost || 0) - (personalExpense.cost || 0);
      newExpense.personalExpense = personalExpense;
    }
    expenseStore.add(newExpense);
  }
  return newExpense;
}
