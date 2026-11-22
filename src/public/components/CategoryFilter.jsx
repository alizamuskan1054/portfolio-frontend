import { FilterTabs } from '@/components/ui/Tabs'

// Projects/Blogs/Publications ka filter. value '' = All.
//   const [category, setCategory] = useState('')
//   <CategoryFilter categories={uniqueValues(projects, 'category')} value={category} onChange={setCategory} />
// Ek hi category ho to filter dikhane ka faida nahi, isliye hide.
export function CategoryFilter({ categories, value, onChange, allLabel = 'All', className }) {
  if (!categories || categories.length < 2) return null

  const options = [{ value: '', label: allLabel }, ...categories.map((c) => ({ value: c, label: c }))]
  return <FilterTabs options={options} value={value} onChange={onChange} className={className} />
}
