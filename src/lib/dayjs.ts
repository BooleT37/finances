import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);
dayjs.extend(customParseFormat);
