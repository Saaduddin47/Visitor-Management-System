import React, {
  ReactNode,
  useState,
  useMemo,
  MouseEvent,
  CSSProperties,
  ButtonHTMLAttributes,
  forwardRef
} from 'react';

type RippleButtonVariant = 'default' | 'hover' | 'ghost' | 'hoverborder';

type RipplePoint = {
  id: number;
  x: number;
  y: number;
  size: number;
};

export interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: RippleButtonVariant;
  hoverRippleColor?: string;
  hoverBorderEffectColor?: string;
  hoverBorderEffectThickness?: string;
}

const baseStyles =
  'relative overflow-hidden inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 disabled:cursor-not-allowed';

const variantStyles: Record<RippleButtonVariant, string> = {
  default: 'bg-accent text-white shadow-soft hover:opacity-95',
  hover: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
  hoverborder: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
};

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      style,
      hoverRippleColor,
      hoverBorderEffectColor,
      hoverBorderEffectThickness,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RipplePoint[]>([]);

    const mergedStyle = useMemo<CSSProperties>(() => {
      const styles: CSSProperties = { ...style };

      if (variant === 'hoverborder') {
        styles.borderColor = hoverBorderEffectColor || styles.borderColor;
        styles.borderWidth = hoverBorderEffectThickness || styles.borderWidth;
      }

      return styles;
    }, [style, variant, hoverBorderEffectColor, hoverBorderEffectThickness]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple: RipplePoint = {
        id: Date.now() + Math.random(),
        x,
        y,
        size
      };

      setRipples((previous) => [...previous, newRipple]);
      window.setTimeout(() => {
        setRipples((previous) => previous.filter((ripple) => ripple.id !== newRipple.id));
      }, 600);

      if (onClick) onClick(event);
    };

    const resolvedRippleColor = hoverRippleColor || 'var(--button-ripple-color)';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`.trim()}
        style={mergedStyle}
        onClick={handleClick}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
        <span className="pointer-events-none absolute inset-0">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full animate-[ripple_600ms_ease-out]"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                backgroundColor: resolvedRippleColor
              }}
            />
          ))}
        </span>
      </button>
    );
  }
);

RippleButton.displayName = 'RippleButton';
