import { Moment } from "moment";
import Currency from "../../../models/Currency";
import { PersonalExpCategoryIds } from "../../../utils/constants";

export default interface FormValues {
  cost: string;
  currency: Currency;
  date: Moment | null;
  category: string | null;
  personalExpCategoryId: PersonalExpCategoryIds | null;
  personalExpSpent: string;
  name: string;
  source: number | null;
}
