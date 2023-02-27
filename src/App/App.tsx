import { Spin } from "antd";
import React from "react";
import styled from "styled-components";
import { api } from "../api";
import categoriesManager from "../readonlyStores/categories";
import sourcesManager from "../readonlyStores/sources";
import expenseStore from "../stores/expenseStore";
import forecastStore from "../stores/forecastStore/forecastStore";
import savingsSpendingStore from "../stores/savingSpendingStore";
import subscriptionStore from "../stores/subscriptionStore";

const SpinWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  align-items: center;
  justify-content: center;
`;

// eslint-disable-next-line mobx/missing-observer
const App = function App({ children }: React.PropsWithChildren<{}>) {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [
        categories,
        subcategories,
        sources,
        expenses,
        forecasts,
        subscriptions,
        savingSpendings,
        savingSpendingsCategories,
      ] = await Promise.all([
        await api.category.getAll(),
        await api.subcategory.getAll(),
        await api.source.getAll(),
        await api.expense.getAll(),
        await api.forecast.getAll(),
        await api.subscription.getAll(),
        await api.savingSpending.getAll(),
        await api.savingSpendingCategory.getAll(),
      ]);
      categoriesManager.fromJson(categories, subcategories);
      sourcesManager.set(sources);
      subscriptionStore.fromJson(subscriptions);
      savingsSpendingStore.fromJson(savingSpendings, savingSpendingsCategories);
      expenseStore.fromJson(expenses);
      forecastStore.fromJson(forecasts);
      setLoaded(true);
    })();
  }, []);

  if (!process.env.REACT_APP_API_URL) {
    return (
      <div>
        ERROR: API url is undefined, please check your environmental settings
      </div>
    );
  }

  if (!loaded) {
    return (
      <SpinWrapper>
        <Spin size="large" tip="Загрузка финансов..." />
      </SpinWrapper>
    );
  }
  return <>{children}</>;
};

export default App;
