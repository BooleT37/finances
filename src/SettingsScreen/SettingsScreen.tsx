import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Row, Tooltip, Typography } from "antd";
import moment from "moment";
import React, { useEffect } from "react";
import styled from "styled-components";
import { CostInput } from "../components/CostInput";
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

const Wrapper = styled.div`
  width: 540px;
`;

const Info = styled.div`
  color: #777;
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
      return "0";
    }
    return lsValue;
  });
  const [savingsDate, setSavingsDate] = React.useState(() => {
    const lsValue = localStorage.getItem(SAVINGS_DATE_LS_KEY);
    if (!lsValue) {
      return null;
    }
    return moment(lsValue);
  });

  const handleSavingsChange = (value: string) => {
    setSavings(value);
    setSavingsDate(today);
  };

  useEffect(() => {
    localStorage.setItem(PE_SUM_LS_KEY, peSum);
  }, [peSum]);

  useEffect(() => {
    localStorage.setItem(SAVINGS_LS_KEY, String(savings));
    savingSpendingStore.setInitialSavings(parseFloat(savings));
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
        <Wrapper>
          <Row align="middle" style={{ padding: "8px 0" }}>
            <Col span={9}>Персональные расходы/мес</Col>
            <Col>
              <CostInput value={peSum} onChange={(e) => setPeSum(e)} />
            </Col>
          </Row>
          <Row align="middle" style={{ padding: "8px 0" }}>
            <Col span={9}>Сбережения</Col>
            <Col span={6}>
              <CostInput value={savings} onChange={handleSavingsChange} />
            </Col>
            <Col>
              {savingsDate && (
                <Info>
                  <Tooltip
                    title={`Текущая сумма сбережений отображается на странице "Траты из сбережений".
                  Она рассчитывается на основе расходов с категориями "В сбережения" и "Из сбережений", сделанных после начальной даты`}
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                  &nbsp;Изменено&nbsp;
                  {savingsDate.format(DATE_FORMAT)}
                </Info>
              )}
            </Col>
          </Row>
        </Wrapper>
      </SiteContent>
    </>
  );
};

export default SettingsScreen;
