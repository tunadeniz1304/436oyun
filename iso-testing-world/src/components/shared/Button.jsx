import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    zoneColor,
    disabled = false,
    type = 'button',
    onClick,
    className = '',
    style,
    ...rest
  },
  ref
) {
  const inlineStyle = zoneColor ? { '--btn-color': zoneColor, ...style } : style;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      style={inlineStyle}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
