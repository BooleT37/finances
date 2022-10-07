const expenseCategoriesOrder = [
  "Отпуск",
  "Продукты",
  "Рестораны",
  "Концерты",
  "Развлечения",
  "Чаевые",
  "Бытовые товары",
  "Косметика",
  "Цветы",
  "Одежда",
  "Медицина",
  "Линзы",
  "Фитнес",
  "Общ. транспорт",
  "Транспорт",
  "Такси",
  "Кино",
  "Подписки",
  "Подарки",
  "Электричество",
  "Аренда",
  "Телефон",
  "Страховки",
  "Учеба",
  "Наличные",
  "Переводы",
  "Штрафы",
  "Налоги",
  "Накопления",
  "Сбережения",
  "Другое",
  "Личные — А",
  "Личные — Л",
];

const incomeCategoriesOrder = ["Зарплата", "Прочие доходы"];

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
