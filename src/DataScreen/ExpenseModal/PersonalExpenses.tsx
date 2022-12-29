import { Divider, Form, FormInstance, Select } from "antd";
import { observer } from "mobx-react";
import React from "react";
import { CostInput } from "../../components/CostInput";
import { CATEGORY_IDS } from "../../models/Category";
import categories from "../../readonlyStores/categories";
import forecastStore from "../../stores/forecastStore";
import { FormValues } from "./models";

const { Option } = Select;

interface Props {
  form: FormInstance<FormValues>;
}

const PersonalExpenses: React.FC<Props> = observer(function PersonalExpenses({
  form,
}) {
  const spent = Form.useWatch("personalExpSpent", form);
  const categoryId = Form.useWatch("personalExpCategoryId", form);
  const date = Form.useWatch("date", form);
  const forecastSum =
    date && categoryId !== null
      ? forecastStore.find(
          date.year(),
          date.month(),
          categories.getById(categoryId)
        )?.sum
      : undefined;
  const extra = forecastSum !== undefined ? `Макс: ${forecastSum}` : null;
  const exceeds = forecastSum !== undefined && parseFloat(spent) > forecastSum;

  return (
    <>
      <Form.Item name="personalExpCategoryId" label="Чьи личные деньги">
        <Select style={{ width: 130 }}>
          <Option value={CATEGORY_IDS.personal.Alexey}>Алексей</Option>
          <Option value={CATEGORY_IDS.personal.Lena}>Лена</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="personalExpSpent"
        label="Сумма личных денег"
        extra={extra}
      >
        <CostInput status={exceeds ? "warning" : ""} />
      </Form.Item>
      <Divider />
    </>
  );
});

export default PersonalExpenses;
