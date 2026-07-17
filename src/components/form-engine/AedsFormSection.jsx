import AedsFieldRenderer from "./AedsFieldRenderer"

export default function AedsFormSection({ section, register, errors, watch }) {
  return (
    <details className="aeds-form-section" open={section.defaultOpen !== false}>
      <summary>
        <div className="aeds-form-section-title">
          <h3>{section.title}</h3>
          {section.description && <p>{section.description}</p>}
        </div>
        <strong>⌄</strong>
      </summary>

      <div className="aeds-form-section-grid">
        {(section.fields || []).map((field) => (
          <AedsFieldRenderer
            key={field.name}
            field={field}
            register={register}
            errors={errors}
            watch={watch}
          />
        ))}
      </div>
    </details>
  )
}
