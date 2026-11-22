import { Card } from '@/components/ui/Card'
import { IconTile } from './IconTile'

// service: { title, short_description, image?, icon? }
export function ServiceCard({ service }) {
  return (
    <Card hoverable className="flex h-full flex-col p-5">
      {service.image ? (
        <img src={service.image} alt="" loading="lazy" className="mb-4 size-12 rounded-xl object-cover" />
      ) : (
        <IconTile name={service.icon} className="mb-4" />
      )}
      <h3 className="text-lg">{service.title}</h3>
      {service.short_description && <p className="mt-2 text-body">{service.short_description}</p>}
    </Card>
  )
}
