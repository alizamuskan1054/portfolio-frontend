import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/notify'

// DRF list: paginated { count, results } ya plain array, dono handle
function normalizeList(data) {
  if (Array.isArray(data)) return { items: data, count: data.length }
  const items = data?.results ?? []
  return { items, count: data?.count ?? items.length }
}

// Field-validation errors form mein dikhte hain, un par toast nahi
function reportError(error) {
  const isFieldValidation =
    error?.status === 400 && error?.errors && typeof error.errors === 'object'
  if (!isFieldValidation) notify.error(error)
}

// List + create/update/remove ek jagah. Cache refresh aur toasts khud.
//   const crud = useCrud(clientsResource, { params: { search, page }, label: 'Client' })
//   await crud.create(values)   // error par throw karta hai: form mein applyServerErrors use karein
export function useCrud(resource, { params, enabled = true, label = 'Item' } = {}) {
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: resource.keys.list(params),
    queryFn: () => resource.list(params),
    enabled,
    placeholderData: keepPreviousData, // page badalte waqt purana data dikhta rehta hai
  })

  const refresh = () =>
    Promise.all(
      [resource.keys.all, ...resource.invalidates].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )

  const createMutation = useMutation({
    mutationFn: (data) => resource.create(data),
    onSuccess: () => {
      notify.success(`${label} created.`)
      return refresh()
    },
    onError: reportError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => resource.update(id, data),
    onSuccess: () => {
      notify.success(`${label} updated.`)
      return refresh()
    },
    onError: reportError,
  })

  const removeMutation = useMutation({
    mutationFn: (id) => resource.remove(id),
    onSuccess: () => {
      notify.success(`${label} deleted.`)
      return refresh()
    },
    onError: reportError,
  })

  const { items, count } = normalizeList(list.data)

  return {
    items,
    count,
    isLoading: list.isPending,
    isFetching: list.isFetching,
    isError: list.isError,
    error: list.error,
    refetch: list.refetch,

    create: createMutation.mutateAsync, // create(data)
    update: (id, data) => updateMutation.mutateAsync({ id, data }),
    remove: removeMutation.mutateAsync, // remove(id)
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: removeMutation.isPending,
  }
}

// Detail page ke liye single item
export function useResourceItem(resource, id, { enabled = true } = {}) {
  return useQuery({
    queryKey: resource.keys.detail(id),
    queryFn: () => resource.get(id),
    enabled: enabled && id !== undefined && id !== null,
  })
}
