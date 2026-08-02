/* ------------------------------------------------------------------ */
/*  SETTINGS MODULE — CONFIG                                            */
/*  Section icon map for the Settings page accordion.                   */
/* ------------------------------------------------------------------ */
import {
  ShieldCheck,
  KeyRound,
  Image,
  Printer,
  FileText,
  Percent,
  Lock,
  Users,
  Calendar,
  AlertTriangle,
  Building2,
  BedDouble,
  BellRing,
} from 'lucide-react'

export const SECTION_ICONS = {
  'my-account': KeyRound,
  'saas-admin': Building2,
  branding: Image,
  'pos-print': Printer,
  'tax-policy': FileText,
  allowance: Percent,
  'role-permissions': ShieldCheck,
  'admin-feature-access': Lock,
  staff: Users,
  notifications: BellRing,
  'reservation-policy': Calendar,
  'room-types-rates': BedDouble,
  'data-system': AlertTriangle,
}
