const expenseCategoriesOrder = [
  "Продукты",
  "Рестораны",
  "Бытовые товары",
  "Техника",
  "Декор",
  "Ремонт",
  "Утварь",
  "Подписки",
  "Транспорт",
  "Развлечения",
  "Концерты",
  "Косметика",
  "Одежда",
  "Здоровье",
  "Кино",
  "Подарки",
  "Должны вернуть",
  "Линзы",
  "Отпуск",
  "Электричество",
  "Аренда",
  "Телефон",
  "Страховки",
  "Цветы",
  "Учеба",
  "Фитнес",
  "Налоги",
  "Налог на тупость",
  "Мамин приезд",
  "Другое",
  "Не помню",
  "Из сбережений",
  "В сбережения",
  "Личные — А",
  "Личные — Л",
];

const incomeCategoriesOrder = ["Зарплата", "Кэшбек", "Прочие доходы"];

const sortCategories = (
  category1: string,
  category2: string,
  order: string[]
) => {
  if (!order.includes(category1)) {
    console.error(
      `Не найдено место в сортировке для категории ${category1}. Вы переменовали ее в базе данных?`
    );
  }
  if (!order.includes(category2)) {
    console.error(
      `Не найдено место в сортировке для категории ${category2}. Вы переменовали ее в базе данных?`
    );
  }
  return order.indexOf(category1) - order.indexOf(category2);
};

export const sortExpenseCategories = (category1: string, category2: string) =>
  sortCategories(category1, category2, expenseCategoriesOrder);

export const sortIncomeCategories = (category1: string, category2: string) =>
  sortCategories(category1, category2, incomeCategoriesOrder);

export const sortAllCategories = (category1: string, category2: string) =>
  sortCategories(category1, category2, [
    ...expenseCategoriesOrder,
    ...incomeCategoriesOrder,
  ]);
