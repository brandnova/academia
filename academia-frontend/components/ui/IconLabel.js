// One icon plus a short label: the pattern behind every meta row in the app
// (asked by, department, views, bylines, school facts). Icon size and text size
// travel together, so they can never drift apart in a copy again.
//   xs  comment bylines          text 11px, icon 12px
//   sm  question meta, bylines   text 12px, icon 14px
//   md  school facts             text 14px, icon 16px
// as: render a different element (a, p). Extra props go to that element.
const SIZES = {
  xs: { text: "text-[11px]", icon: 12, gap: "gap-1" },
  sm: { text: "text-xs", icon: 14, gap: "gap-1" },
  md: { text: "text-sm", icon: 16, gap: "gap-1.5" },
};

export default function IconLabel({
  icon: Icon,
  size = "sm",
  as: Tag = "span",
  className = "",
  children,
  ...props
}) {
  const s = SIZES[size] ?? SIZES.sm;
  return (
    <Tag className={`flex items-center ${s.gap} ${s.text} ${className}`} {...props}>
      <Icon size={s.icon} aria-hidden="true" className="shrink-0" />
      {children}
    </Tag>
  );
}