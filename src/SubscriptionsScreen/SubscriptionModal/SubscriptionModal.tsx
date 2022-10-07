import { Button, DatePicker, Form, Input, InputRef, Modal, Select } from "antd";
import { runInAction } from "mobx";
import moment, { Moment } from "moment";
import React from "react";
import { DATE_FORMAT } from "../../constants";
import Subscription, {
  SubscriptionFormValues as FormValues,
} from "../../models/Subscription";
import categories from "../../readonlyStores/categories";
import sources from "../../readonlyStores/sources";
import subscriptionStore from "../../stores/subscriptionStore";

const NEW_SUBSCRIPTION_ID = -1;

interface ValidatedFormValues extends Omit<FormValues, "date" | "categoryId"> {
  firstDate: Moment;
  categoryId: number;
}

function formValuesToSubscription(
  id: number | null,
  values: ValidatedFormValues
): Subscription {
  return new Subscription(
    id ?? NEW_SUBSCRIPTION_ID,
    values.name,
    parseFloat(values.cost),
    categories.getById(values.categoryId),
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
  categoryId: null,
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
        runInAction(async () => {
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
        });
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
          rules={[
            { required: true, message: "Введите сумму" },
            {
              pattern: /^[0-9.-]+$/,
              message: "Сумма должна быть числом",
              validateTrigger: "onChange",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="categoryId"
          label="Категория"
          rules={[{ required: true, message: "Выберите категорию" }]}
        >
          <Select
            options={categories.expenseOptions}
            placeholder="Начните вводить"
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
