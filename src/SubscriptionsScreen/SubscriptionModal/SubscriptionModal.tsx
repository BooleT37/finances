import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  DatePicker,
  InputRef,
} from "antd";
import { RuleObject } from "antd/lib/form";
import moment from "moment";
import { Moment } from "moment";
import React from "react";
import categories from "../../readonlyStores/categories";
import sources from "../../readonlyStores/sources";
import Subscription, {
  SubscriptionFormValues as FormValues,
} from "../../models/Subscription";
import { DATE_FORMAT } from "../../constants";
import subscriptionStore from "../../stores/subscriptionStore";

const NEW_SUBSCRIPTION_ID = -1;

interface ValidatedFormValues extends Omit<FormValues, "date" | "category"> {
  firstDate: Moment;
  category: string;
}

function formValuesToSubscription(
  id: number | null,
  values: ValidatedFormValues
): Subscription {
  return new Subscription(
    id || NEW_SUBSCRIPTION_ID,
    values.name,
    parseFloat(values.cost),
    categories.getByName(values.category),
    values.period,
    values.firstDate,
    values.source !== null ? sources.getById(values.source) : null
  );
}

const today = moment();

const INITIAL_VALUES: FormValues = {
  id: 0,
  name: "",
  cost: "",
  category: null,
  period: 1,
  firstDate: today,
  source: null,
};

interface Props {
  visible: boolean;
  subscriptionId: number | null;
  onClose(): void;
}

// eslint-disable-next-line mobx/missing-observer
const SubscriptionModal: React.FC<Props> = function SubscriptionModal({
  visible,
  subscriptionId,
  onClose,
}) {
  const [form] = Form.useForm<FormValues>();
  const firstFieldRef = React.useRef<InputRef>(null);

  const handleSubmit = () => {
    form
      .validateFields()
      .then(async (values: FormValues) => {
        const subscription = formValuesToSubscription(
          subscriptionId,
          values as ValidatedFormValues
        );
        if (subscriptionId === null) {
          await subscriptionStore.add(subscription);
        } else {
          subscriptionStore.modify(subscription);
        }
        onClose();
      })
      .catch((info) => {
        console.error("Validate Failed:", info);
      });
  };

  React.useEffect(() => {
    if (visible) {
      if (subscriptionId === null) {
        form.setFieldsValue(INITIAL_VALUES);
      } else {
        form.setFieldsValue(
          subscriptionStore.getFormValuesByIdOrThrow(subscriptionId)
        );
      }
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 0);
    }
  }, [form, subscriptionId, visible]);

  const categoryValidator = (_: RuleObject, value: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!value || categories.getByName(value)) {
        resolve();
        return;
      }
      reject(new Error("Категория не найдена"));
    });
  };

  const sourcesOptions = React.useMemo(() => {
    const options = sources.asOptions;
    options.unshift({ value: null, label: "Нет источника" });
    return options;
  }, []);

  const periodOptions = React.useMemo(() => {
    return [1, 3, 6, 12].map((period) => ({
      value: period,
      label: Subscription.periodToString(period),
    }));
  }, []);

  return (
    <Modal
      visible={visible}
      title={
        subscriptionId === null ? "Новая подписка" : "Редактирование подписки"
      }
      onOk={handleSubmit}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {subscriptionId === null ? "Добавить" : "Сохранить"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={INITIAL_VALUES}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="Имя"
          rules={[{ required: true, message: "Введите имя" }]}
        >
          <Input ref={firstFieldRef} />
        </Form.Item>
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: "Введите сумму" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="category"
          label="Категория"
          rules={[
            { required: true, message: "Выберите категорию" },
            {
              validator: categoryValidator,
              validateTrigger: "onSubmit",
            },
          ]}
        >
          <AutoComplete
            options={categories.expenseOptions}
            placeholder="Начните вводить"
            filterOption
          />
        </Form.Item>
        <Form.Item name="period" label="Период">
          <Select options={periodOptions} />
        </Form.Item>
        <Form.Item
          name="firstDate"
          label="Первая дата списания"
          rules={[{ required: true, message: "Введите дату" }]}
        >
          <DatePicker format={DATE_FORMAT} allowClear={false} />
        </Form.Item>
        <Form.Item name="source" label="Источник">
          <Select options={sourcesOptions} placeholder="Не указано" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SubscriptionModal;
