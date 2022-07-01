import { Moment } from "moment";
import Currency from "../../../models/Currency";
import { PersonalExpCategoryIds } from "../../../utils/constants";

export default interface FormValues {
  cost: string,
  currency: Currency,
  date: Moment | null,
  category: string,
  personalExpCategoryId: PersonalExpCategoryIds | undefined,
  personalExpSpent: string,
  name: string
}