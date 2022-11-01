import { Input, Space, Typography } from "antd";
import moment from "moment";
import React, { useEffect } from "react";
import styled from "styled-components";
import {
  DATE_FORMAT,
  DATE_SERVER_FORMAT,
  PE_SUM_DEFAULT,
  PE_SUM_LS_KEY,
  SAVINGS_DATE_LS_KEY,
  SAVINGS_LS_KEY,
} from "../constants";
import SiteContent from "../SiteContent";
import savingSpendingStore from "../stores/savingSpendingStore";
import WhiteHeader from "../WhiteHeader";

const { Title } = Typography;

const PeSumInput = styled(Input)`
  width: 300px;
`;

const today = moment();

// eslint-disable-next-line mobx/missing-observer
const SettingsScreen: React.FC = () => {
  const [peSum, setPeSum] = React.useState(() => {
    const peSumInLs = localStorage.getItem(PE_SUM_LS_KEY);
    return peSumInLs ? peSumInLs : PE_SUM_DEFAULT.toString();
  });
  const [savings, setSavings] = React.useState(() => {
    const lsValue = localStorage.getItem(SAVINGS_LS_KEY);
    if (!lsValue) {
      return 0;
    }
    return parseFloat(lsValue);
  });
  const [savingsDate, setSavingsDate] = React.useState(() => {
    const lsValue = localStorage.getItem(SAVINGS_DATE_LS_KEY);
    if (!lsValue) {
      return null;
    }
    return moment(lsValue);
  });

  const handleSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSavings(parseFloat(e.target.value));
    setSavingsDate(today);
  };

  useEffect(() => {
    localStorage.setItem(PE_SUM_LS_KEY, peSum);
  }, [peSum]);

  useEffect(() => {
    localStorage.setItem(SAVINGS_LS_KEY, String(savings));
    savingSpendingStore.setInitialSavings(savings);
  }, [savings]);

  useEffect(() => {
    if (savingsDate) {
      localStorage.setItem(
        SAVINGS_DATE_LS_KEY,
        savingsDate.format(DATE_SERVER_FORMAT)
      );
      savingSpendingStore.setInitialSavingsDate(savingsDate);
    }
  }, [savingsDate]);

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Настройки</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical">
          <PeSumInput
            type="number"
            addonBefore="Персональные расходы/мес (€)"
            value={peSum}
            onChange={(e) => setPeSum(e.target.value)}
          />
          <Input
            type="number"
            addonBefore="Сбережения (€)"
            value={savings}
            onChange={handleSavingsChange}
            addonAfter={
              savingsDate && `Изменено ${savingsDate.format(DATE_FORMAT)}`
            }
          />
        </Space>
      </SiteContent>
    </>
  );
};

export default SettingsScreen;
