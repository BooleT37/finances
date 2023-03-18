import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, FormInstance, Input, Space } from "antd";
import { forwardRef, useImperativeHandle } from "react";
import { generateTempId } from "../../utils/tempId";
import { CostInput } from "../CostInput";

interface CostItem {
  id: number;
  name: string;
  sum: number;
  comment: string;
}

export interface FormValues {
  name: string;
  costs: CostItem[];
}

interface Props {
  includeComment?: boolean;
  editingValue?: FormValues;
  name?: {
    placeholder: string;
  };
  sumPlaceholder?: string;
  hideNameForSingleRow?: boolean;
  onFinish(values: FormValues): void;
}

export type CostsListFormInterface = {
  submit: FormInstance<FormValues>["submit"];
};

const CostsListForm = forwardRef<CostsListFormInterface, Props>(
  (props, ref) => {
    const {
      includeComment,
      editingValue,
      name, // Событие
      sumPlaceholder, // План
      hideNameForSingleRow,
      onFinish,
    } = props;
    const [form] = Form.useForm<FormValues>();

    useImperativeHandle(ref, () => ({
      submit: () => form.submit(),
    }));

    const initialValues: FormValues = editingValue || {
      name: "",
      costs: [
        {
          id: generateTempId(),
          name: "",
          sum: 0,
          comment: "",
        },
      ],
    };

    return (
      <Form<FormValues>
        initialValues={initialValues}
        form={form}
        name="costs_list_form"
        onFinish={onFinish}
        autoComplete="off"
      >
        {name && (
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input placeholder={name.placeholder} style={{ width: 300 }} />
          </Form.Item>
        )}
        <Form.List name="costs">
          {(fields, { add, remove }) => {
            const nameHidden = hideNameForSingleRow && fields.length === 1;
            return (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="start"
                  >
                    {!nameHidden && (
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        rules={[{ required: true, message: "Введите имя" }]}
                      >
                        <Input placeholder="Категория" />
                      </Form.Item>
                    )}
                    <Form.Item
                      rules={[{ required: true, message: "Введите сумму" }]}
                      {...restField}
                      name={[name, "sum"]}
                    >
                      <CostInput placeholder={sumPlaceholder} />
                    </Form.Item>
                    <Form.Item
                      hidden={!includeComment}
                      {...restField}
                      name={[name, "comment"]}
                    >
                      <Input
                        placeholder="Комментарий"
                        style={{ width: nameHidden ? 335 : 160 }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        type="link"
                        icon={
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        }
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
            );
          }}
        </Form.List>
      </Form>
    );
  }
);

export default CostsListForm;
