import { api } from './client'

// Ek REST resource ke liye standard CRUD + query keys.
//   const clientsResource = createResource('/clients', { name: 'clients' })
// invalidates: mutation ke baad jin query keys ko bhi refresh karna ho (jaise dashboard stats)
export function createResource(path, { name, invalidates = [] } = {}) {
  const base = path.replace(/\/+$/, '')
  const keyName = name ?? base

  return {
    name: keyName,
    invalidates,
    keys: {
      all: [keyName],
      list: (params) => [keyName, 'list', params ?? {}],
      detail: (id) => [keyName, 'detail', id],
    },
    list: (params) => api.get(`${base}/`, { params }),
    get: (id) => api.get(`${base}/${id}/`),
    create: (data) => api.post(`${base}/`, data),
    update: (id, data) => api.patch(`${base}/${id}/`, data), // PATCH: partial update
    remove: (id) => api.delete(`${base}/${id}/`),
  }
}
