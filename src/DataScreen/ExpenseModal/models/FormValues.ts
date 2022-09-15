import { Moment } from "moment";
import { PersonalExpCategoryIds } from "../../../utils/constants";

export default interface FormValues {
  cost: string;
  date: Moment | null;
  category: string | null;
  personalExpCategoryId: PersonalExpCategoryIds | null;
  personalExpSpent: string;
  name: string;
  source: number | null;
}
