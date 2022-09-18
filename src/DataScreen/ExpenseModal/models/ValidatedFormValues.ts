import { Moment } from "moment";
import FormValues from "./FormValues";

export default interface ValidatedFormValues
  extends Omit<FormValues, "date" | "category"> {
  date: Moment;
  category: number;
}
