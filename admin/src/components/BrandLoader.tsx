interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export function BrandLoader({
  size = 'md',
  fullScreen = false,
  theme = 'dark',
  className = '',
}: BrandLoaderProps) {
  const dims =
    size === 'sm'
      ? { ring: 'h-12 w-12', logo: 'h-5 w-5' }
      : size === 'lg'
      ? { ring: 'h-20 w-20', logo: 'h-9 w-9' }
      : { ring: 'h-16 w-16', logo: 'h-7 w-7' };

  const spinner = (
    <div
      role="status"
      aria-label="A carregar"
      className={`relative inline-flex items-center justify-center ${dims.ring} ${className}`}
    >
      {/* Anel base subtil */}
      <span
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: 'rgb(var(--border-strong) / 0.35)' }}
      />
      {/* Arco circular rotativo */}
      <span
        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
        style={{
          borderTopColor: 'rgb(var(--brand))',
          borderRightColor: 'rgb(var(--brand) / 0.35)',
          animationDuration: '0.9s',
        }}
      />
      {/* Apenas a logo centrada */}
      <img
        src={theme === 'dark' ? '/logo-mark.png' : '/logo-mark.png'}
        alt="JOGIMIL"
        className={`${dims.logo} object-contain select-none`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center app-bg">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-12">
      {spinner}
    </div>
  );
}
