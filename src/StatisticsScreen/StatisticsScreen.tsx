import { Button, Space, Typography } from "antd";
import React, { useState } from "react";
import styled from "styled-components";
import SiteContent from "../SiteContent";
import WhiteHeader from "../WhiteHeader";
import ComparisonChart from "./ComparisonChart";
import DynamicsChart from "./DynamicsChart";
import { YearReview } from "./YearReview";

const YearReviewCta = styled.div`
  font-size: 16px;
  position: absolute;
  top: 0;
  left: 500px;
`;

const { Title } = Typography;

/* eslint-disable mobx/missing-observer */
const StatisticsScreen: React.FC = () => {
  const [yearReviewVisible, setYearReviewVisible] = useState(false);

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Статистика</Title>
        <YearReviewCta>
          ✨ Итоги 2022 готовы!&nbsp;&nbsp;
          <Button
            onClick={() => {
              setYearReviewVisible(true);
            }}
          >
            Посмотреть
          </Button>
        </YearReviewCta>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <ComparisonChart />
          <DynamicsChart />
        </Space>
        <YearReview
          visible={yearReviewVisible}
          onClose={() => {
            setYearReviewVisible(false);
          }}
        />
      </SiteContent>
    </>
  );
};

export default StatisticsScreen;
