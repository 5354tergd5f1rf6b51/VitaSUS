export default function Campo({ rotulo, id, classe = '', ...props }) {
  return (
    <div className={`campo ${classe}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} name={id} {...props} />
    </div>
  )
}
