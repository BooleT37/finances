import { Moment } from "moment";

export default function resetTime(date: Moment) {
  date.hours(0)
  date.minutes(0)
  date.seconds(0)
  date.milliseconds(0);
  return date
}