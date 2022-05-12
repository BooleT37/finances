import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  DatePicker,
  InputRef
} from 'antd';
import { action, reaction } from 'mobx';
import { observer } from 'mobx-react';
import moment from 'moment';
import { Moment } from 'moment';
import React from 'react';
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
  category: 'Подписки',
  name: '',
  date: moment()
}

interface Props {
  onSubmit(expense: Expense): void
}

const ExpenseModal: React.FC<Props> = observer(function ExpenseModal({ onSubmit: onClose }) {
  const [form] = Form.useForm<FormValues>();
  const inputRef = React.useRef<InputRef>(null);

  const handleSubmit = () => {
    form
      .validateFields()
      .then(action(values => {
        form.resetFields();
        const expense = new Expense(
          expenseModalStore.expenseId,
          parseFloat(values.cost),
          values.currency,
          values.date.format('YYYY-MM-DD'),
          categoryStore.getByName(values.category),
          values.name
        )
        expenseStore.insert(expense)
        expenseModalStore.close()
        onClose(expense)
      }))
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
            date: moment(expenseModalStore.currentExpense.date)
          })
        } else {
          form.setFieldsValue(INITIAL_VALUES)
        }
        inputRef.current?.focus()
      }
    })
  }, [form])

  return (
    <Modal
      visible={expenseModalStore.visible}
      title={ expenseModalStore.isNewExpense ? 'Редактирование траты' : 'Новая трата'}
      onOk={handleSubmit}
      onCancel={() => { expenseModalStore.close() }}
      footer={[
        <Checkbox key="more">Добавить ещё</Checkbox>,
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
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: 'Введите сумму траты' }]}
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
          rules={[{ required: true, message: 'Выберите категорию' }]}
        >
          <AutoComplete
            options={categoryStore.asOptions}
            placeholder="Начните вводить"
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