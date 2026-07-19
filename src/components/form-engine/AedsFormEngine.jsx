import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import AedsFormSection from "./AedsFormSection"
import AedsFormStepper from "./AedsFormStepper"
import AedsFormToolbar from "./AedsFormToolbar"
import "./aeds-form-engine.css"

function buildDefaultValues(sections = []) {
  return sections.reduce((acc, section) => {
    ;(section.fields || []).forEach((field) => {
      acc[field.name] = field.defaultValue ?? ""
    })
    return acc
  }, {})
}

export default function AedsFormEngine({
  title,
  subtitle,
  moduleName = "Aura Stay ERP",
  sections = [],
  steps = [],
  onSubmit,
  defaultValues,
}) {
  const [activeStep, setActiveStep] = useState(0)

  const initialValues = useMemo(
    () => ({ ...buildDefaultValues(sections), ...(defaultValues || {}) }),
    [sections, defaultValues]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: initialValues,
    mode: "onBlur",
  })

  const visibleSections = steps.length
    ? sections.filter((section) => !section.stepId || section.stepId === steps[activeStep]?.id)
    : sections

  const submit = (values) => {
    if (onSubmit) onSubmit(values)
    else console.log("AEDS FORM SUBMIT", values)
  }

  return (
    <form className="aeds-form-shell" onSubmit={handleSubmit(submit)}>
      <header className="aeds-form-header">
        <div>
          <p className="aeds-form-eyebrow">{moduleName}</p>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <span className="aeds-form-status">
          {isDirty ? "Unsaved Changes" : "Saved"}
        </span>
      </header>

      <AedsFormToolbar dirty={isDirty} onReset={() => reset(initialValues)} />

      <AedsFormStepper
        steps={steps}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
      />

      <div className="aeds-form-body">
        {visibleSections.map((section) => (
          <AedsFormSection
            key={section.id || section.title}
            section={section}
            register={register}
            errors={errors}
            watch={watch}
          />
        ))}
      </div>

      <footer className="aeds-form-footer">
        {steps.length > 0 && activeStep > 0 && (
          <button type="button" className="aeds-form-btn" onClick={() => setActiveStep((current) => current - 1)}>
            Previous
          </button>
        )}

        {steps.length > 0 && activeStep < steps.length - 1 ? (
          <button type="button" className="aeds-form-btn primary" onClick={() => setActiveStep((current) => current + 1)}>
            Next
          </button>
        ) : (
          <button type="submit" className="aeds-form-btn primary">
            Save & Finish
          </button>
        )}
      </footer>
    </form>
  )
}
