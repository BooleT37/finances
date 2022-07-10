import { Space, Typography } from "antd";
import React from "react";
import SiteContent from "../SiteContent";
import WhiteHeader from "../WhiteHeader";
import ComparisonChart from "./ComparisonChart";
import DynamicsChart from "./DynamicsChart";

/* eslint-disable mobx/missing-observer */

const { Title } = Typography;

const StatisticsScreen: React.FC = () => {
  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Статистика</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <ComparisonChart />
          <DynamicsChart />
        </Space>
      </SiteContent>
    </>
  );
};

export default StatisticsScreen;
