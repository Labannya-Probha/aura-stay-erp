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
  const user = toReportUser(req)

  const job = await pdfReportQueue.add('generate', {
    reportCode: req.params.reportCode,
    params: {
      ...(req.body || {}),
      tenantId: user.tenantId,
    },
    user,
    format,
    requestedBy: user.id,
    tenantId: user.tenantId,
    requestMeta: {
      requestedAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
    },
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

router.post(
  '/reports/:reportCode/generate',
  asyncRoute(async (req, res) => {
    const payload = await generateReport(req.params.reportCode, req.body, toReportUser(req))
    res.json(payload)
  }),
)

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

    if (!job) {
      return res.status(404).json({
        error: 'Export job not found',
      })
    }

    const requestUser = toReportUser(req)
    const jobTenantId = job.data?.tenantId || job.data?.user?.tenantId

    const jobUserId = job.data?.requestedBy || job.data?.user?.id

    const isSuperuser = requestUser.role === 'SUPERUSER'

    if (
      !isSuperuser &&
      (!jobTenantId ||
        jobTenantId !== requestUser.tenantId ||
        !jobUserId ||
        jobUserId !== requestUser.id)
    ) {
      return res.status(403).json({
        error: 'Export job access denied',
      })
    }

    const state = await job.getState()

    const payload = {
      jobId: job.id,
      status: state,
    }

    if (state === 'completed') {
      payload.result = job.returnvalue
    }

    if (state === 'failed') {
      payload.error = job.failedReason || 'Export generation failed'
    }

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

router.use((error, req, res, _next) => {
  res.status(error.status || 500).json({
    error: error.message || 'Report service failed',
    code: error.status || 500,
  })
})

export default router
