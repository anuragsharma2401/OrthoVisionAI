function GoogleButton({ disabled, onClick, text }) {
  return (
    <button
      className="google-button"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span aria-hidden="true">G</span>
      {text}
    </button>
  )
}

export default GoogleButton
