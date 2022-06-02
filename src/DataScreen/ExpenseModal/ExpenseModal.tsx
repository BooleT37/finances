import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  DatePicker,
  InputRef,
  Radio,
  Space
} from 'antd';
import { RuleObject } from 'antd/lib/form';
import { action, autorun, reaction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react';
import moment from 'moment';
import { Moment } from 'moment';
import React from 'react';
import styled from 'styled-components';
import Currency from '../../models/Currency';
import Expense from '../../models/Expense';
import categoryStore from '../../stores/categoryStore';
import expenseStore from '../../stores/expenseStore';
import expenseModalStore from '../expenseModalStore';

const { Option } = Select;

interface FormValues {
  cost: string,
  currency: Currency,
  date: Moment,
  category: string,
  name: string
}

const INITIAL_VALUES: FormValues = {
  cost: '',
  currency: Currency.Eur,
  category: '',
  name: '',
  date: moment()
}

interface Props {
  onSubmit(expense: Expense): void
}

const RadioGroup = styled(Radio.Group)`
  display: block;
  margin: 0 0 24px 33%;
`

const ExpenseModal: React.FC<Props> = observer(function ExpenseModal({ onSubmit }) {
  const [form] = Form.useForm<FormValues>();
  const inputRef = React.useRef<InputRef>(null);
  const addMore = useLocalObservable<{ value: boolean }>(() => ({ value: false }))
  const isIncome = useLocalObservable<{ value: boolean }>(() => ({ value: false }))

  const handleSubmit = () => {
    form
      .validateFields()
      .then(action(values => {
        form.resetFields();
        const expense = new Expense(
          expenseModalStore.expenseId,
          parseFloat(values.cost),
          values.currency,
          values.date,
          categoryStore.getByName(values.category),
          values.name
        )
        if (addMore.value) {
          expenseModalStore.expenseId = expenseStore.nextId
        } else {
          expenseModalStore.close()
        }
        onSubmit(expense)
        return expense
      }))
      .then(expenseStore.insert)
      .catch(info => {
        console.log('Validate Failed:', info);
      });

  }

  React.useEffect(() => {
    return reaction(() => expenseModalStore.visible, () => {
      if (expenseModalStore.visible) {
        if (expenseModalStore.currentExpense) {
          form.setFieldsValue({
            cost: String(expenseModalStore.currentExpense.cost),
            currency: expenseModalStore.currentExpense.currency,
            category: expenseModalStore.currentExpense.category.name,
            name: expenseModalStore.currentExpense.name || '',
            date: expenseModalStore.currentExpense.date
          })
        } else {
          form.setFieldsValue(INITIAL_VALUES)
        }
        inputRef.current?.focus()
      }
    })
  }, [form])

  reaction(() => isIncome.value, () => {
    form.resetFields(['category'])
  })

  const categoryValidator = (_: RuleObject, value: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!value) {
        resolve()
        return
      }
      const disposer = autorun(() => {
        if (categoryStore.getByName(value)) {
          resolve()
          return
        }
      })
      disposer()
      reject(new Error('Категория не найдена'))
    })
  }

  return (
    <Modal
      visible={expenseModalStore.visible}
      title={expenseModalStore.isNewExpense ? 'Новая трата' : 'Редактирование траты'}
      onOk={handleSubmit}
      onCancel={() => { expenseModalStore.close() }}
      footer={[
        expenseModalStore.isNewExpense && (
          <Checkbox
            checked={addMore.value}
            onChange={(e) => addMore.value = e.target.checked}
            key="more"
          >
            Добавить ещё
          </Checkbox>
        ),
        <Button key="cancel" onClick={() => { expenseModalStore.close() }}>
          Отмена
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Ввод
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
        <RadioGroup
          value={isIncome.value ? "income" : "expense"}
          onChange={action(e => isIncome.value = e.target.value === "income")}
        >
          <Space size="large">
            <Radio value="expense">Расход</Radio>
            <Radio value="income">Доход</Radio>
          </Space>
        </RadioGroup>
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: 'Введите сумму' }]}
        >
          <Input ref={inputRef} />
        </Form.Item>
        <Form.Item name="currency" label="Валюта">
          <Select>
            <Option value={Currency.Eur}>€</Option>
            <Option value={Currency.Rub}>₽</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="date"
          label="Дата"
          rules={[{ required: true, message: 'Введите дату' }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="category"
          label="Категория"
          rules={[
            { required: true, message: 'Выберите категорию' },
            {
              validator: categoryValidator,
              validateTrigger: 'onSubmit'
            }
          ]}
        >
          <AutoComplete
            options={isIncome.value ? categoryStore.incomeOptions : categoryStore.expenseOptions}
            placeholder="Начните вводить"
            filterOption
          />
        </Form.Item>
        <Form.Item name="name" label="Коментарий">
          <Input />
        </Form.Item>
      </Form>
    </Modal >
  )
});

export default ExpenseModal