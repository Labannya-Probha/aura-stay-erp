export default function AedsFormStepper({ steps = [], activeStep, setActiveStep }) {
  if (!steps.length) return null

  return (
    <div className="aeds-form-stepper">
      {steps.map((step, index) => (
        <button
          key={step.id || step.title}
          type="button"
          className={`aeds-form-step ${index === activeStep ? "active" : ""}`}
          onClick={() => setActiveStep(index)}
        >
          <strong>{index + 1}. {step.title}</strong>
          <span>{step.description}</span>
        </button>
      ))}
    </div>
  )
}
