// Filter ke options: list se unique values (khali chhor kar), pehli baar aane ke order mein.
//   uniqueValues(projects, 'category')            -> ['Healthcare', 'Education']
//   uniqueValues(publications, 'year', 'desc')    -> [2024, 2023, ...]
export function uniqueValues(items, key, sort) {
  const values = [...new Set((items ?? []).map((item) => item?.[key]).filter((v) => v !== undefined && v !== null && v !== ''))]
  if (sort === 'asc') return values.sort((a, b) => (a > b ? 1 : -1))
  if (sort === 'desc') return values.sort((a, b) => (a < b ? 1 : -1))
  return values
}

// category '' = sab; warna match
export const filterBy = (items, key, value) =>
  !value ? (items ?? []) : (items ?? []).filter((item) => String(item?.[key]) === String(value))
