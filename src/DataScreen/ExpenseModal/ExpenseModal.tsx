import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  DatePicker,
  Radio,
  Space,
  Divider,
} from "antd";
import type { BaseSelectRef } from "rc-select";
import { RuleObject } from "antd/lib/form";
import { action, reaction, runInAction } from "mobx";
import { observer, useLocalObservable } from "mobx-react";
import { Moment } from "moment";
import React from "react";
import styled from "styled-components";
import { DATE_FORMAT } from "../../constants";
import Currency from "../../models/Currency";
import Expense from "../../models/Expense";
import categories from "../../readonlyStores/categories";
import sources from "../../readonlyStores/sources";
import expenseModalStore from "../expenseModalStore";
import moment from "moment";
import { FormValues, ValidatedFormValues } from "./models";
import { insertExpense } from "./utils";
import PersonalExpenses from "./PersonalExpenses";
import SourceLastExpenses from "./SourceLastExpenses";
import expenseStore from "../../stores/expenseStore";
import type { Option } from "../../types";
import subscriptionStore from "../../stores/subscriptionStore";

function expenseToFormValues(expense: Expense): FormValues {
  return {
    cost: expense.personalExpense
      ? String((expense.personalExpense.cost || 0) + (expense.cost || 0))
      : String(expense.cost),
    category: expense.category.name || null,
    name: expense.name || "",
    personalExpCategoryId: expense.personalExpense?.category.id ?? null,
    personalExpSpent: String(expense.personalExpense?.cost ?? ""),
    date: expense.date,
    source: expense.source?.id ?? null,
    subscription: expense.subscription?.id ?? null,
  };
}

interface Props {
  startDate: Moment | null;
  endDate: Moment | null;

  onSubmit(expense: Expense): void;
}

const RadioGroup = styled(Radio.Group)`
  display: block;
  margin: 0 0 24px 33%;
`;

const today = moment();

const ExpenseModal: React.FC<Props> = observer(function ExpenseModal({
  startDate,
  endDate,
  onSubmit,
}) {
  const [form] = Form.useForm<FormValues>();
  const acRef = React.useRef<BaseSelectRef>(null);
  const addMore = useLocalObservable<{ value: boolean }>(() => ({
    value: false,
  }));
  const isIncome = useLocalObservable<{ value: boolean }>(() => ({
    value: false,
  }));
  const [hasPersonalExp, setHasPersonalExp] = React.useState(false);
  const { lastSource } = expenseModalStore;

  const INITIAL_VALUES: FormValues = React.useMemo(
    () => ({
      cost: "",
      subscription: null,
      currency: Currency.Eur,
      category: null,
      name: "",
      personalExpCategoryId: null,
      personalExpSpent: "",
      date: today.isBetween(startDate, endDate) ? today : startDate,
      source: lastSource,
    }),
    [endDate, startDate, lastSource]
  );

  const handleSubmit = () => {
    form
      .validateFields()
      .then(
        action(async (values) => {
          form.resetFields();
          form.setFieldsValue({ source: values.source });
          if (!hasPersonalExp) {
            values.personalExpCategoryId = null;
            values.personalExpSpent = "0";
          }
          const expense = insertExpense(values as ValidatedFormValues);
          if (addMore.value) {
            expenseModalStore.lastExpenseId = expense.id;
            expenseModalStore.expenseId = null;
            form.setFieldsValue({ date: values.date });
          } else {
            expenseModalStore.close(values.source);
          }
          onSubmit(expense);
          return expense;
        })
      )
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  React.useEffect(() => {
    return reaction(
      () => expenseModalStore.visible,
      () => {
        if (expenseModalStore.visible) {
          if (expenseModalStore.currentExpense) {
            form.setFieldsValue(
              expenseToFormValues(expenseModalStore.currentExpense)
            );
            setHasPersonalExp(
              !!expenseModalStore.currentExpense.personalExpense
            );
            addMore.value = false;
          } else {
            form.setFieldsValue(INITIAL_VALUES);
            setHasPersonalExp(false);
          }
          setTimeout(() => {
            acRef.current?.focus();
          }, 0);
        }
      }
    );
  }, [INITIAL_VALUES, addMore, form]);

  reaction(
    () => isIncome.value,
    () => {
      form.resetFields(["category"]);
    }
  );

  const categoryValidator = (_: RuleObject, value: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!value || categories.getByName(value)) {
        resolve();
        return;
      }
      reject(new Error("Категория не найдена"));
    });
  };

  const disabledDate = (date: Moment) => {
    return (
      (startDate && date.isBefore(startDate)) ||
      (endDate && date.isAfter(endDate)) ||
      false
    );
  };

  const handleInsertPreviousClick = () => {
    if (expenseModalStore.lastExpense) {
      form.setFieldsValue(expenseToFormValues(expenseModalStore.lastExpense));
    }
  };

  const sourcesOptions = React.useMemo(() => {
    const options = sources.asOptions;
    options.unshift({ value: null, label: "Нет источника" });
    return options;
  }, []);

  const sourceId = Form.useWatch("source", form);
  const categoryName = Form.useWatch("category", form);
  const currentCategory = categoryName
    ? categories.getByNameIfExists(categoryName)
    : null;
  const sourceExtra =
    sourceId === null || sourceId === undefined ? null : (
      <SourceLastExpenses sourceId={sourceId} />
    );

  const availabileSubscriptions =
    startDate && endDate && currentCategory
      ? expenseStore.getAvailableSubscriptions(
          startDate,
          endDate,
          currentCategory
        )
      : [];
  const subscriptionOptions: Option[] = availabileSubscriptions.map((s) => ({
    label: s.subscription.name,
    value: s.subscription.id,
  }));

  const handleValuesChange = (changedValues: Partial<FormValues>) => {
    if (changedValues.subscription) {
      const subscription = subscriptionStore.getById(
        changedValues.subscription
      );
      const subscriptionData = availabileSubscriptions.find(
        (s) => s.subscription.id === changedValues.subscription
      );
      if (!subscriptionData) {
        throw new Error(
          `Couldn't fin subscription with id ${changedValues.subscription}`
        );
      }
      form.setFieldsValue({
        cost: subscription.cost.toString(),
        date: subscriptionData.firstDate,
        name: subscriptionData.subscription.name,
        source: subscription.source?.id,
      });
    }
  };

  return (
    <Modal
      visible={expenseModalStore.visible}
      title={
        expenseModalStore.isNewExpense ? "Новая трата" : "Редактирование траты"
      }
      onOk={handleSubmit}
      onCancel={() => {
        expenseModalStore.close(form.getFieldValue("source"));
      }}
      width={540}
      footer={[
        expenseModalStore.lastExpense && (
          <Button type="link" onClick={handleInsertPreviousClick}>
            Подставить предыдущий
          </Button>
        ),
        expenseModalStore.isNewExpense && (
          <Checkbox
            checked={addMore.value}
            onChange={(e) =>
              runInAction(() => {
                addMore.value = e.target.checked;
              })
            }
            key="more"
          >
            Добавить ещё
          </Checkbox>
        ),
        <Button
          key="cancel"
          onClick={() => {
            expenseModalStore.close(form.getFieldValue("source"));
          }}
        >
          Отмена
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Добавить
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
        onValuesChange={handleValuesChange}
      >
        <RadioGroup
          value={isIncome.value ? "income" : "expense"}
          onChange={action(
            (e) => (isIncome.value = e.target.value === "income")
          )}
        >
          <Space size="large">
            <Radio value="expense">Расход</Radio>
            <Radio value="income">Доход</Radio>
          </Space>
        </RadioGroup>
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
            options={
              isIncome.value
                ? categories.incomeAcOptions
                : categories.expenseAcOptions
            }
            placeholder="Начните вводить"
            filterOption
            ref={acRef}
          />
        </Form.Item>
        {subscriptionOptions.length > 0 && (
          <Form.Item
            name="subscription"
            label="Подписка"
            getValueFromEvent={(value) => value.value}
          >
            <Select
              options={subscriptionOptions}
              labelInValue
              placeholder="Не указана"
            />
          </Form.Item>
        )}
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: "Введите сумму" }]}
        >
          <Input />
        </Form.Item>
        {!isIncome.value && (
          <Divider orientation="center">
            <Checkbox
              checked={hasPersonalExp}
              onChange={(e) => setHasPersonalExp(e.target.checked)}
            >
              Из личных
            </Checkbox>
          </Divider>
        )}
        {hasPersonalExp && !isIncome.value && <PersonalExpenses form={form} />}
        <Form.Item
          name="date"
          label="Дата"
          rules={[{ required: true, message: "Введите дату" }]}
        >
          <DatePicker
            disabledDate={disabledDate}
            format={DATE_FORMAT}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item name="name" label="Коментарий">
          <Input />
        </Form.Item>
        <Form.Item name="source" label="Источник" extra={sourceExtra}>
          <Select options={sourcesOptions} placeholder="Не указано" />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default ExpenseModal;
