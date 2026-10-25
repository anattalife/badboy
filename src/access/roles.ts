import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Staff roles. Each role unlocks a slice of the admin:
 * - admin:   everything, including staff accounts and site settings
 * - manager: all content and records, but not staff accounts
 * - sales:   equipment, inventory and sales leads
 * - finance: loan applications (the only role besides admin that can see SSN/income)
 * - service: service requests
 * - parts:   parts catalog and orders
 */
export const ROLES = ['admin', 'manager', 'sales', 'finance', 'service', 'parts'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  finance: 'Finance',
  service: 'Service',
  parts: 'Parts',
}

type MaybeUser = { roles?: Role[] | null } | null | undefined

export const userHasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((role) => role === 'admin' || roles.includes(role)))

const reqUser = (req: PayloadRequest) => req.user as MaybeUser

/** Admin only. */
export const isAdmin: Access = ({ req }) => Boolean(reqUser(req)?.roles?.includes('admin'))

export const isAdminField: FieldAccess = ({ req }) =>
  Boolean(reqUser(req)?.roles?.includes('admin'))

/** Admin, or any of the listed roles (admin always passes). */
export const hasRole =
  (...roles: Role[]): Access =>
  ({ req }) =>
    userHasRole(reqUser(req), ...roles)

/** Any signed-in staff member. */
export const isStaff: Access = ({ req }) => Boolean(reqUser(req))

/** Content managers: admin and manager. */
export const isContentManager: Access = hasRole('manager')

/**
 * Public can read published documents only; staff can read drafts too.
 * Use on collections with `versions.drafts` enabled.
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (reqUser(req)) return true
  return { _status: { equals: 'published' } }
}

export const anyone: Access = () => true
