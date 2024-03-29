import {
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
} from "antd";
import { action, reaction, runInAction } from "mobx";
import { observer, useLocalObservable } from "mobx-react";
import moment, { Moment } from "moment";
import type { BaseSelectRef } from "rc-select";
import React, { useCallback } from "react";
import styled from "styled-components";
import { CostInput } from "../../components/CostInput";
import { DATE_FORMAT } from "../../constants";
import { CATEGORY_IDS, PersonalExpCategoryIds } from "../../models/Category";
import Currency from "../../models/Currency";
import Expense from "../../models/Expense";
import categories from "../../readonlyStores/categories";
import sources from "../../readonlyStores/sources";
import expenseStore from "../../stores/expenseStore";
import savingSpendingStore from "../../stores/savingSpendingStore";
import subscriptionStore from "../../stores/subscriptionStore";
import type { Option } from "../../types";
import expenseModalStore from "../expenseModalStore";
import { FormValues, ValidatedFormValues } from "./models";
import PersonalExpenses from "./PersonalExpenses";
import SourceLastExpenses from "./SourceLastExpenses";
import { insertExpense } from "./utils";

function expenseToFormValues(expense: Expense): FormValues {
  return {
    cost: expense.personalExpense
      ? String((expense.personalExpense.cost ?? 0) + (expense.cost ?? 0))
      : String(expense.cost),
    category: expense.category.id ?? null,
    subcategory: expense.subcategory?.id ?? null,
    name: expense.name || "",
    personalExpCategoryId: expense.personalExpense?.category.id ?? null,
    personalExpSpent: String(expense.personalExpense?.cost ?? ""),
    date: expense.date,
    source: expense.source?.id ?? null,
    subscription: expense.subscription?.id ?? null,
    savingSpendingId: expense.savingSpending
      ? expense.savingSpending.spending.id
      : null,
    savingSpendingCategoryId: expense.savingSpending
      ? expense.savingSpending.category.id
      : null,
  };
}

const ModalStyled = styled(Modal)`
  .ant-modal-footer {
    white-space: nowrap;
  }
`;

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
  const firstFieldRef = React.useRef<BaseSelectRef>(null);
  const addMore = useLocalObservable<{ value: boolean }>(() => ({
    value: true,
  }));
  const isIncome = useLocalObservable<{ value: boolean }>(() => ({
    value: false,
  }));
  const [hasPersonalExp, setHasPersonalExp] = React.useState(false);
  const { lastSource, isNewExpense } = expenseModalStore;

  const INITIAL_VALUES: FormValues = React.useMemo(
    () => ({
      cost: "",
      subscription: null,
      currency: Currency.Eur,
      category: null,
      subcategory: null,
      name: "",
      personalExpCategoryId: null,
      personalExpSpent: "",
      date: today.isBetween(startDate, endDate) ? today : startDate,
      source: lastSource,
      savingSpendingId: null,
      savingSpendingCategoryId: null,
    }),
    [endDate, startDate, lastSource]
  );

  const handleSubmit = async () => {
    form
      .validateFields()
      .then(
        action(async (values) => {
          // auto set the first saving spending category if it's the only one
          if (values.savingSpendingId !== null) {
            const { categories } = savingSpendingStore.getById(
              values.savingSpendingId
            );
            if (categories.length === 1) {
              values.savingSpendingCategoryId = categories[0].id;
            }
          }

          form.resetFields();
          form.setFieldsValue({ source: values.source });
          if (!hasPersonalExp) {
            values.personalExpCategoryId = null;
            values.personalExpSpent = "0";
          }
          const expense = await insertExpense(values as ValidatedFormValues);
          runInAction(() => {
            if (addMore.value) {
              expenseModalStore.lastExpenseId = expense.id;
              expenseModalStore.expenseId = null;
              form.setFieldsValue({ date: values.date });
            } else {
              expenseModalStore.close(values.source);
            }
            onSubmit(expense);
          });
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
            firstFieldRef.current?.focus();
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

  const savingSpendingOptions = React.useMemo(() => {
    const options = savingSpendingStore.asOptions.slice();
    options.unshift({ value: null, label: "Нет события" });
    return options;
  }, []);

  const sourceId: number | null = Form.useWatch("source", form) ?? null;
  const categoryId: number | null = Form.useWatch("category", form) ?? null;
  const savingSpendingId: number | null =
    Form.useWatch("savingSpendingId", form) ?? null;
  const currentCategory =
    categoryId !== null ? categories.getById(categoryId) : null;
  const sourceExtra =
    sourceId === null ? null : <SourceLastExpenses sourceId={sourceId} />;

  const savingSpendingCategoryOptions = React.useMemo(() => {
    if (savingSpendingId === null) {
      return [];
    }
    return savingSpendingStore.categoriesAsOptions(savingSpendingId);
  }, [savingSpendingId]);

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
    if (
      changedValues.subscription !== null &&
      changedValues.subscription !== undefined
    ) {
      const subscription = subscriptionStore.getJsById(
        changedValues.subscription
      );
      const subscriptionData = availabileSubscriptions.find(
        (s) => s.subscription.id === changedValues.subscription
      );
      if (!subscriptionData) {
        throw new Error(
          `Couldn't find subscription with id ${changedValues.subscription}`
        );
      }
      form.setFieldsValue({
        cost: subscription.cost.toString(),
        date: subscriptionData.firstDate,
        name: subscriptionData.subscription.name,
        source: subscription.source?.id,
      });
    }
    runInAction(() => {
      if (
        changedValues.savingSpendingId !== null &&
        changedValues.savingSpendingId !== undefined
      ) {
        const { categories } = savingSpendingStore.getById(
          changedValues.savingSpendingId
        );
        form.setFieldsValue({
          savingSpendingCategoryId:
            categories.length === 1 ? categories[0].id : null,
        });
      }
    });
    if (changedValues.savingSpendingId === null) {
      form.setFieldsValue({
        savingSpendingCategoryId: null,
      });
    }
  };

  const handleTransferAllPeClick = useCallback(
    (categoryId: PersonalExpCategoryIds) => {
      const currentName = form.getFieldValue("name");
      form.setFieldsValue({
        category: categoryId,
        personalExpCategoryId: null,
        personalExpSpent: "0",
        name: currentCategory
          ? currentName
            ? `${currentCategory.name} - ${currentName}`
            : currentCategory.name
          : currentName,
      });
      setHasPersonalExp(false);
    },
    [currentCategory, form]
  );

  const subcategories = currentCategory
    ? [{ value: null, label: "Нет подкатегории" } as Option].concat(
        currentCategory.subcategories.map((s) => s.asOption)
      )
    : [];

  return (
    <ModalStyled
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
          <Button
            key="insertLast"
            type="link"
            onClick={handleInsertPreviousClick}
          >
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
          {isNewExpense ? "Добавить" : "Сохранить"}
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
            {
              required: true,
              message: "Выберите категорию",
            },
          ]}
        >
          <Select
            options={
              isIncome.value
                ? categories.incomeOptions
                : categories.expenseOptions
            }
            placeholder="Выберите категорию"
            style={{ width: 250 }}
            ref={firstFieldRef}
          />
        </Form.Item>
        <Form.Item
          hidden={
            !currentCategory || currentCategory.subcategories.length === 0
          }
          name="subcategory"
          label="Подкатегория"
        >
          <Select
            options={subcategories}
            placeholder="Выберите подкатегорию"
            style={{ width: 250 }}
          />
        </Form.Item>
        <Form.Item
          name="savingSpendingId"
          label="Событие"
          hidden={categoryId !== CATEGORY_IDS.fromSavings}
          rules={[
            {
              required: categoryId === CATEGORY_IDS.fromSavings,
              message: "Выберите событие",
            },
          ]}
        >
          <Select
            options={savingSpendingOptions}
            placeholder="Не указано"
            style={{ width: 250 }}
          />
        </Form.Item>
        {categoryId === CATEGORY_IDS.fromSavings &&
          savingSpendingCategoryOptions.length > 1 && (
            <Form.Item
              name="savingSpendingCategoryId"
              label="Категория события"
              rules={[
                {
                  required: categoryId === CATEGORY_IDS.fromSavings,
                  message: "Выберите категорию",
                },
              ]}
            >
              <Select
                disabled={savingSpendingId === null}
                options={savingSpendingCategoryOptions}
                placeholder="Выберите категорию"
                style={{ width: 250 }}
                ref={firstFieldRef}
              />
            </Form.Item>
          )}
        {subscriptionOptions.length > 0 && (
          <Form.Item name="subscription" label="Подписка">
            <Select
              options={[
                {
                  label: "Не указана",
                  value: null,
                } as Option,
              ].concat(subscriptionOptions)}
              placeholder="Не указана"
              style={{ width: 250 }}
            />
          </Form.Item>
        )}
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: "Введите сумму" }]}
        >
          <CostInput />
        </Form.Item>
        {(categoryId === null ||
          ![
            PersonalExpCategoryIds.Alexey,
            PersonalExpCategoryIds.Lena,
          ].includes(categoryId)) &&
          !isIncome.value && (
            <Divider orientation="center">
              <Checkbox
                checked={hasPersonalExp}
                onChange={(e) => setHasPersonalExp(e.target.checked)}
              >
                Из личных
              </Checkbox>
            </Divider>
          )}
        {hasPersonalExp && !isIncome.value && (
          <PersonalExpenses
            form={form}
            onTransferAll={handleTransferAllPeClick}
          />
        )}
        <Form.Item
          name="date"
          label="Дата"
          rules={[{ required: true, message: "Введите дату" }]}
        >
          <DatePicker format={DATE_FORMAT} allowClear={false} />
        </Form.Item>
        <Form.Item name="name" label="Коментарий">
          <Input />
        </Form.Item>
        <Form.Item name="source" label="Источник" extra={sourceExtra}>
          <Select
            options={sourcesOptions}
            placeholder="Не указано"
            style={{ width: 150 }}
          />
        </Form.Item>
      </Form>
    </ModalStyled>
  );
});

export default ExpenseModal;
