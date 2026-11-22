import { createResource } from './resource'

export const clientsResource = createResource('/clients', {
  name: 'clients',
  invalidates: [['dashboard']],
})
