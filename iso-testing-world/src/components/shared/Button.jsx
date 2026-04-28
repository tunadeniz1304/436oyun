import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    zoneColor,
    disabled = false,
    loading = false,
    icon,
    iconRight,
    type = 'button',
    onClick,
    className = '',
    style,
    ...rest
  },
  ref
) {
  const inlineStyle = zoneColor ? { '--btn-color': zoneColor, ...style } : style;
  const isDisabled = disabled || loading;
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={isDisabled ? undefined : onClick}
      className={classes}
      style={inlineStyle}
      {...rest}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn__icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span className="btn__label">{children}</span>
      {!loading && iconRight ? (
        <span className="btn__icon" aria-hidden="true">{iconRight}</span>
      ) : null}
    </button>
  );
});

export default Button;
