import { Eye, EyeOff } from 'lucide-react'

function FormField({
  error,
  id,
  label,
  onTogglePassword,
  showPassword,
  type = 'text',
  ...inputProps
}) {
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <div className={`input-shell ${error ? 'has-error' : ''}`}>
        <input id={id} type={resolvedType} {...inputProps} />
        {isPassword && (
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="password-toggle"
            type="button"
            onClick={onTogglePassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export default FormField
