export default function costToString(value: number) {
  return value < 0 ? `-€${-value}` : `€${value}`;
}
