import { Checkbox, Space, Typography } from "antd";
import { groupBy, sum } from "lodash";
import { observer } from "mobx-react";
import { useState } from "react";
import { CATEGORY_IDS } from "../../../../models/Category";
import categories from "../../../../readonlyStores/categories";
import expenseStore from "../../../../stores/expenseStore";
import subscriptionStore from "../../../../stores/subscriptionStore";
import { roundCost } from "../../../../utils";
import { SubscriptionDatum, SubscriptionsChart } from "./SubscriptionsChart";

const { Title } = Typography;

export const SubscriptionsStep: React.FC = observer(
  function SubscriptionsStep() {
    const [rentShown, setRentShown] = useState(false);
    const [thisYearByCategories, setThisYearByCategories] = useState(true);
    const [nextYearByCategories, setNextYearByCategories] = useState(true);
    const { expenses } = expenseStore;
    const { activeSubscriptions } = subscriptionStore;
    const thisYearExpenses = expenses.filter(
      (e) =>
        (rentShown || e.category.id !== CATEGORY_IDS.rent) &&
        e.date.year() === 2022 &&
        e.subscription != null
    );

    const filteredActiveSubscriptions = activeSubscriptions.filter(
      (s) => rentShown || s.category.id !== CATEGORY_IDS.rent
    );

    const thisYearDataByCategories: SubscriptionDatum[] = Object.entries(
      groupBy(thisYearExpenses, "category.id")
    )
      .map(([categoryId, expenses]) => ({
        name: categories.getById(parseInt(categoryId)).name,
        spent: roundCost(sum(expenses.map((e) => e.cost ?? 0))),
      }))
      .sort((d1, d2) => d2.spent - d1.spent);

    const thisYearDataBySubscriptions: SubscriptionDatum[] = Object.entries(
      groupBy(thisYearExpenses, "name")
    )
      .map(([name, expenses]) => ({
        name,
        spent: roundCost(sum(expenses.map((e) => e.cost ?? 0))),
      }))
      .sort((d1, d2) => d2.spent - d1.spent);

    const nextYearForecastByCategories: SubscriptionDatum[] = Object.entries(
      groupBy(filteredActiveSubscriptions, "category.id")
    )
      .map(([categoryId, subscriptions]) => ({
        name: categories.getById(parseInt(categoryId)).name,
        spent: roundCost(sum(subscriptions.map((s) => s.costPerMonth * 12))),
      }))
      .sort((d1, d2) => d2.spent - d1.spent);

    const nextYearForecastBySubscriptions: SubscriptionDatum[] = Object.entries(
      groupBy(filteredActiveSubscriptions, "name")
    )
      .map(([name, subscriptions]) => ({
        name,
        spent: roundCost(sum(subscriptions.map((s) => s.costPerMonth * 12))),
      }))
      .sort((d1, d2) => d2.spent - d1.spent);

    return (
      <div>
        <Title level={3}>Подписки</Title>
        <Space direction="vertical">
          <Checkbox
            checked={rentShown}
            onChange={(e) => {
              setRentShown(e.target.checked);
            }}
          >
            Показать аренду
          </Checkbox>
          <div>
            <Checkbox
              checked={thisYearByCategories}
              onChange={(e) => {
                setThisYearByCategories(e.target.checked);
              }}
            >
              Сгруппировать по категориям
            </Checkbox>
            {thisYearByCategories ? (
              <SubscriptionsChart
                title="Потрачено в этом году по категориям"
                yName="Потрачено"
                data={thisYearDataByCategories}
              />
            ) : (
              <SubscriptionsChart
                title="Потрачено в этом году по подпискам"
                yName="Потрачено"
                data={thisYearDataBySubscriptions}
              />
            )}
          </div>
          <div>
            <Checkbox
              checked={nextYearByCategories}
              onChange={(e) => {
                setNextYearByCategories(e.target.checked);
              }}
            >
              Сгруппировать по категориям
            </Checkbox>
            {nextYearByCategories ? (
              <SubscriptionsChart
                title="Прогноз на следующий год по категориям"
                yName="Прогноз"
                data={nextYearForecastByCategories}
              />
            ) : (
              <SubscriptionsChart
                title="Прогноз на следующий год по подпискам"
                yName="Прогноз"
                data={nextYearForecastBySubscriptions}
              />
            )}
          </div>
        </Space>
      </div>
    );
  }
);
