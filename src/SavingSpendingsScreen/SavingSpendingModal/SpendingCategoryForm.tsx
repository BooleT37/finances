import { Button, Form, Input, InputNumber } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useState } from "react";

export interface FormValues {
  name: string;
  forecast: number;
  comment: string;
}

interface Props {
  initialValues: FormValues;
  onSubmit(values: FormValues): void;
}

// eslint-disable-next-line mobx/missing-observer
const SpendingCategoryForm: React.FC<Props> = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm<FormValues>();
  const [changed, setChanged] = useState(false);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      setChanged(false);
    });
  };

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="inline"
      onChange={() => {
        setChanged(true);
      }}
    >
      <Form.Item name="name" label="Категория" required>
        <Input />
      </Form.Item>
      <Form.Item name="forecast" label="План" required>
        <InputNumber />
      </Form.Item>
      <Form.Item name="comment" label="Комментарий">
        <Input />
      </Form.Item>
      <Button
        disabled={!changed}
        type="link"
        icon={<SaveOutlined />}
        onClick={handleSubmit}
      />
    </Form>
  );
};

export default SpendingCategoryForm;
