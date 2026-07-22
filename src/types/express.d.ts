export {}

declare global {
  namespace Express {
    export interface Request {
      authUser?: {
        id: string
        email: string
        tenantId: string
        role: string
        reportCodes?: string[]
      }
    }
  }
}
