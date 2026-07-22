let sdk = null

export async function initTelemetry() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return false

  try {
    const [api, resources, semantic, sdkNode, auto] = await Promise.all([
      import('@opentelemetry/api'),
      import('@opentelemetry/resources'),
      import('@opentelemetry/semantic-conventions'),
      import('@opentelemetry/sdk-node'),
      import('@opentelemetry/auto-instrumentations-node'),
    ])

    sdk = new sdkNode.NodeSDK({
      resource: new resources.Resource({
        [semantic.SemanticResourceAttributes.SERVICE_NAME]:
          process.env.OTEL_SERVICE_NAME || 'aura-stay-api',
        [semantic.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
          process.env.NODE_ENV || 'development',
      }),
      instrumentations: [auto.getNodeAutoInstrumentations()],
    })

    await sdk.start()
    const tracer = api.trace.getTracer('aura-stay-api')
    tracer.startSpan('telemetry.started').end()
    return true
  } catch (error) {
    console.warn('Telemetry disabled:', error?.message || error)
    return false
  }
}

export async function shutdownTelemetry() {
  if (!sdk) return
  try {
    await sdk.shutdown()
  } catch (error) {
    console.warn('Telemetry shutdown warning:', error?.message || error)
  }
}
