import { Divider, Form, FormInstance, Select, Space } from "antd";
import Link from "antd/lib/typography/Link";
import React, { useCallback } from "react";
import { CostInput } from "../../../components/CostInput";
import { CATEGORY_IDS, PersonalExpCategoryIds } from "../../../models/Category";
import { FormValues } from "../models";
import { useForecastSum } from "./useForecastSum";

const { Option } = Select;

interface Props {
  form: FormInstance<FormValues>;
  onTransferAll(categoryId: PersonalExpCategoryIds): void;
}

// eslint-disable-next-line mobx/missing-observer
const PersonalExpenses: React.FC<Props> = ({ form, onTransferAll }) => {
  const spent = Form.useWatch("personalExpSpent", form);
  const categoryId = Form.useWatch("personalExpCategoryId", form);
  const date = Form.useWatch("date", form);
  const forecastSum = useForecastSum(date, categoryId);

  const extra = forecastSum !== undefined ? `Макс: ${forecastSum}` : null;
  const exceeds = forecastSum !== undefined && parseFloat(spent) > forecastSum;

  const handleTransferAllClick = useCallback(() => {
    if (categoryId !== null) {
      onTransferAll(categoryId);
    }
  }, [categoryId, onTransferAll]);

  return (
    <>
      <Form.Item
        name="personalExpCategoryId"
        label="Чьи личные деньги"
        rules={[{ required: true, message: "Выберите, чьи деньги" }]}
      >
        <Select style={{ width: 130 }}>
          <Option value={CATEGORY_IDS.personal.Alexey}>Алексей</Option>
          <Option value={CATEGORY_IDS.personal.Lena}>Лена</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="personalExpSpent"
        label="Сумма личных денег"
        extra={extra}
        rules={[{ required: true, message: "Введите сумму" }]}
      >
        <Space>
          <CostInput status={exceeds ? "warning" : ""} />
          <Link disabled={categoryId === null} onClick={handleTransferAllClick}>
            Перенести все
          </Link>
        </Space>
      </Form.Item>
      <Divider />
    </>
  );
};

export default PersonalExpenses;
