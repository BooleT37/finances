import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './index.css';
import reportWebVitals from './reportWebVitals';
import configureMobx from './configureMobx';
import SiteLayout from './SiteLayout';
import DataScreen from './DataScreen';
import StatisticsScreen from './StatisticsScreen';
import PlanningScreen from './PlanningScreen';

import 'antd/dist/antd.min.css';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

const container: HTMLElement | null = document.getElementById('root');
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteLayout>
        <Routes>
          <Route path="data" element={<DataScreen />} />
          <Route path="statistics" element={<StatisticsScreen />} />
          <Route path="planning" element={<PlanningScreen />} />
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  </React.StrictMode>,
  container
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
configureMobx();
