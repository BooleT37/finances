import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import minMax from 'dayjs/plugin/minMax.js';

dayjs.extend(minMax);
dayjs.extend(customParseFormat);
