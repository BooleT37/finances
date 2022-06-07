import { Moment } from "moment";

export default function setTimeToMax(date: Moment) {
  date.hours(23)
  date.minutes(59)
  date.seconds(59)
  return date
}