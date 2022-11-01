import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, FormInstance, Input, InputNumber, Space } from "antd";
import { generateTempId } from "../../utils/tempId";

interface CategoryFormValues {
  id: number;
  name: string;
  forecast: number;
  comment: string;
}

export interface FormValues {
  name: string;
  categories: CategoryFormValues[];
}

interface Props {
  formRef: FormInstance<FormValues>;
  onFinish(values: FormValues): void;
}

// eslint-disable-next-line mobx/missing-observer
const SpendingCategoryForm: React.FC<Props> = ({ onFinish, formRef }) => {
  return (
    <Form
      initialValues={{
        name: "",
        categories: [
          {
            id: generateTempId(),
            name: "",
            forecast: 0,
            comment: "",
          },
        ],
      }}
      form={formRef}
      name="spending_categories_form"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: "Введите имя события" }]}
      >
        <Input placeholder="Событие" style={{ width: 300 }} />
      </Form.Item>
      <Form.List name="categories">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{ display: "flex", marginBottom: 8 }}
                align="start"
              >
                {fields.length > 1 && (
                  <Form.Item
                    {...restField}
                    name={[name, "name"]}
                    rules={[{ required: true, message: "Введите имя" }]}
                  >
                    <Input placeholder="Категория" />
                  </Form.Item>
                )}
                <Form.Item {...restField} name={[name, "forecast"]}>
                  <InputNumber
                    placeholder="План"
                    addonBefore="€"
                    style={{ width: 130 }}
                  />
                </Form.Item>
                <Form.Item {...restField} name={[name, "comment"]}>
                  <Input
                    placeholder="Комментарий"
                    style={{ width: fields.length > 1 ? 160 : 335 }}
                  />
                </Form.Item>
                {fields.length > 1 && (
                  <Button
                    type="link"
                    icon={<MinusCircleOutlined onClick={() => remove(name)} />}
                  />
                )}
              </Space>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    id: generateTempId(),
                    name: "",
                    forecast: 0,
                    comment: "",
                  })
                }
                block
                icon={<PlusOutlined />}
              >
                Добавить категорию
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default SpendingCategoryForm;
