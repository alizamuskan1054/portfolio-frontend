import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { cn } from '@/lib/utils'

// Panels wale tabs (wizard: Education, Experience...). Keyboard arrows kaam karte hain.
// items: [{ key, label, icon, badge, content }]
// keepMounted: har tab ka content mounted rakhta hai (form state na jaye)
export function Tabs({ items, selectedIndex, defaultIndex = 0, onChange, keepMounted = false, className }) {
  return (
    <TabGroup
      selectedIndex={selectedIndex}
      defaultIndex={defaultIndex}
      onChange={onChange}
      className={className}
    >
      <TabList className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map(({ key, label, icon: Icon, badge }) => (
          <Tab
            key={key}
            className="relative -mb-px flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap text-muted transition-colors outline-none hover:text-heading data-focus:text-primary data-selected:border-primary data-selected:text-primary"
          >
            {Icon && <Icon className="size-4" />}
            {label}
            {badge !== undefined && (
              <span className="rounded-full bg-primary-soft px-1.5 text-xs text-primary">{badge}</span>
            )}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="pt-6">
        {items.map(({ key, content }) => (
          <TabPanel key={key} unmount={!keepMounted} className="focus:outline-none">
            {content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}

// Panels ke baghair filter tabs (All / Published / Draft). Controlled.
// options: [{ value, label, count }]
export function FilterTabs({ options, value, onChange, className }) {
  return (
    <div role="group" className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line bg-card text-body hover:border-primary hover:text-primary',
            )}
          >
            {opt.label}
            {opt.count !== undefined && <span className="ml-1.5 opacity-70">{opt.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
