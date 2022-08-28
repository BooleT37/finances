import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import "moment/locale/ru";
import locale from "antd/lib/locale/ru_RU";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import configureMobx from "./configureMobx";
import SiteLayout from "./SiteLayout";
import DataScreen from "./DataScreen";
import StatisticsScreen from "./StatisticsScreen";
import PlanningScreen from "./PlanningScreen";
import SettingsScreen from "./SettingsScreen";
import SubscriptionsScreen from "./SubscriptionsScreen";

import "antd/dist/antd.min.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";

const container: HTMLElement | null = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={locale}>
        <App>
          <SiteLayout>
            <Routes>
              <Route index element={<Navigate replace to="/screens/data" />} />
              <Route path="screens/data" element={<DataScreen />} />
              <Route path="screens/statistics" element={<StatisticsScreen />} />
              <Route path="screens/planning" element={<PlanningScreen />} />
              <Route path="screens/settings" element={<SettingsScreen />} />
              <Route
                path="screens/subscriptions"
                element={<SubscriptionsScreen />}
              />
            </Routes>
          </SiteLayout>
        </App>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
  container
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
configureMobx();
