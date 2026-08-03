import { containsPersian, persianTextClass } from "../utils/persianText";

/**
 * Apply Peyda/Morabba fonts when admin content includes Persian script.
 * @param {{
 *   as?: keyof JSX.IntrinsicElements,
 *   variant?: "body" | "heading",
 *   className?: string,
 *   children?: React.ReactNode
 * }} props
 */
export default function PersianText({
  as: Tag = "span",
  variant = "body",
  className = "",
  children,
  ...props
}) {
  const text = typeof children === "string" ? children : "";
  const persianClass = persianTextClass(text, variant);
  const mergedClassName = [className, persianClass].filter(Boolean).join(" ") || undefined;

  return (
    <Tag
      className={mergedClassName}
      dir={containsPersian(text) ? "auto" : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
