import express from 'express'
import { generateReport, getReport, listReports } from './reportService.js'
import { toCsv, toPdfHtml } from './exporters.js'
import { requireAuth } from '../middleware/auth.js'
import { pdfReportQueue } from '../../queues/pdfReport.queue.js'

const router = express.Router()

const toReportUser = (req) => ({
  id: req.authUser.id,
  name: req.authUser.email,
  role: req.authUser.role,
  reportCodes: req.authUser.reportCodes,
})

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

router.post('/reports/:reportCode/export/csv', (req, res) => {
  const payload = generateReport(req.params.reportCode, req.body, toReportUser(req))
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${payload.report.code}.csv"`)
  res.send(toCsv(payload))
})

router.post(
  '/reports/:reportCode/export/excel',
  asyncRoute(async (req, res) => {
    const job = await pdfReportQueue.add('generate', {
      reportCode: req.params.reportCode,
      params: req.body,
      user: toReportUser(req),
      format: 'excel',
    })
    res.status(202).json({ jobId: job.id, status: 'QUEUED' })
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

router.post('/reports/:reportCode/export/pdf', (req, res) => {
  const payload = generateReport(req.params.reportCode, req.body, toReportUser(req))
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="${payload.report.code}.html"`)
  res.send(toPdfHtml(payload))
})

// Example admin route pattern:
// router.delete('/reports/:reportCode', requireRole('SUPERUSER', 'ADMIN'), asyncRoute(async (req, res) => { ... }))

router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    error: error.message || 'Report service failed',
    code: error.status || 500,
  })
})

export default router
