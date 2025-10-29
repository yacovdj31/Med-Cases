export default function Button({ variant='primary', className='', ...props }) {
    const base = 'btn';
    const map = {
      primary: 'btn-primary',
      ghost: 'btn-ghost',
      outline: 'btn-outline',
    };
    return <button className={`${base} ${map[variant] || ''} ${className}`} {...props} />;
  }
  