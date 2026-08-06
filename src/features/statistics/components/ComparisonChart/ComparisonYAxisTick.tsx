import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { YAxisTickContentProps } from 'recharts';

import { getIconByValue } from '~/features/categories/components/categoryIcons/categoryIcons';

export const CATEGORY_AXIS_WIDTH = 130;

const CATEGORY_TICK_ICON_SIZE = 12;
const CATEGORY_TICK_ICON_GAP = 6;
// Icon + label share a fixed-width slot starting this far left of the tick's
// anchor point (which sits right at the plot's edge), so the label always
// starts at the same x regardless of whether its category has an icon.
const CATEGORY_TICK_BLOCK_START = -(CATEGORY_AXIS_WIDTH - 20);

interface Props extends YAxisTickContentProps {
  categoryIconByShortname: Map<string, string | null>;
}

export function ComparisonYAxisTick({
  x,
  y,
  payload,
  categoryIconByShortname,
}: Props) {
  const shortname = String(payload.value);
  const iconValue = categoryIconByShortname.get(shortname);
  const icon = iconValue ? getIconByValue(iconValue) : undefined;
  const textX =
    CATEGORY_TICK_BLOCK_START +
    CATEGORY_TICK_ICON_SIZE +
    CATEGORY_TICK_ICON_GAP;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {icon && (
        // recharts renders axis ticks inside an SVG <g>, not the regular DOM,
        // so we can't reuse the app's NameWithOptionalIcon (it renders HTML
        // <span>/<Group>). FontAwesomeIcon itself renders an <svg>, and a
        // nested <svg> is valid SVG (it opens its own viewport), so we can
        // position it directly via x/y/width/height like any other SVG node.
        <FontAwesomeIcon
          icon={icon}
          x={CATEGORY_TICK_BLOCK_START}
          y={-CATEGORY_TICK_ICON_SIZE / 2}
          width={CATEGORY_TICK_ICON_SIZE}
          height={CATEGORY_TICK_ICON_SIZE}
        />
      )}
      <text x={textX} y={0} dy={4} fontSize={12} fill="currentColor">
        {shortname}
      </text>
    </g>
  );
}
