import { Moment } from "moment";
import { PersonalExpCategoryIds } from "../../../utils/constants";

export default interface FormValues {
  cost: string;
  subscription: number | null;
  date: Moment | null;
  category: number | null;
  personalExpCategoryId: PersonalExpCategoryIds | null;
  personalExpSpent: string;
  savingSpendingId: number | null;
  savingSpendingCategoryId: number | null;
  name: string;
  source: number | null;
}
