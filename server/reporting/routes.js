import express from 'express'
import { generateReport, getReport, listReports } from './reportService.js'
import { requireAuth } from '../middleware/auth.js'
import { pdfReportQueue } from '../../queues/pdfReport.queue.js'

const router = express.Router()

const toReportUser = (req) => ({
  id: req.authUser.id,
  name: req.authUser.email,
  role: req.authUser.role,
  reportCodes: req.authUser.reportCodes,
  tenantId: req.authUser.tenantId,
})

const enqueueReportExport = async (req, format) => {
  const job = await pdfReportQueue.add('generate', {
    reportCode: req.params.reportCode,
    params: req.body,
    user: toReportUser(req),
    format,
  })

  return {
    jobId: job.id,
    status: 'QUEUED',
    format,
    reportCode: req.params.reportCode,
  }
}

const asyncRoute = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (error) {
    next(error)
  }
}

router.use(requireAuth())

router.get('/reports', (req, res) => {
  res.json(listReports(toReportUser(req)))
})

router.get('/reports/:reportCode', (req, res) => {
  res.json(getReport(req.params.reportCode, toReportUser(req)))
})

router.post('/reports/:reportCode/generate', (req, res) => {
  res.json(generateReport(req.params.reportCode, req.body, toReportUser(req)))
})

router.post(
  '/reports/:reportCode/export/csv',
  asyncRoute(async (req, res) => {
    const payload = await enqueueReportExport(req, 'csv')
    res.status(202).json(payload)
  }),
)

router.post(
  '/reports/:reportCode/export/excel',
  asyncRoute(async (req, res) => {
    const payload = await enqueueReportExport(req, 'excel')
    res.status(202).json(payload)
  }),
)

router.get(
  '/reports/jobs/:jobId',
  asyncRoute(async (req, res) => {
    const job = await pdfReportQueue.getJob(req.params.jobId)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    const state = await job.getState()
    const payload = { jobId: job.id, status: state }
    if (state === 'completed') payload.result = job.returnvalue
    if (state === 'failed') payload.error = job.failedReason
    res.json(payload)
  }),
)

router.post(
  '/reports/:reportCode/export/pdf',
  asyncRoute(async (req, res) => {
    const payload = await enqueueReportExport(req, 'pdf')
    res.status(202).json(payload)
  }),
)

// Example admin route pattern:
// router.delete('/reports/:reportCode', requireRole('SUPERUSER', 'ADMIN'), asyncRoute(async (req, res) => { ... }))

router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    error: error.message || 'Report service failed',
    code: error.status || 500,
  })
})

export default router
