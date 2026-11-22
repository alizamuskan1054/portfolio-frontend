/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './Container'

// Section = background + spacing + visibility wrapper.
//   <Section tone="blue-tint" visible={vis.isVisible('home', 'testimonials', items.length > 0)}>
// visible=false ho to kuch render nahi hota (toggle OFF ya content khali).
// Planning doc: neighbouring sections ka background alag ho (navy, background, blue-tint, surface).
const tones = {
  background: 'bg-background',
  surface: 'bg-surface',
  'blue-tint': 'bg-blue-tint',
  navy: 'bg-navy text-on-navy [&_:is(h1,h2,h3,h4)]:text-on-navy',
}

const SectionToneContext = createContext({ inverted: false })

// SectionHeading jaise children navy par khud inverted ho jate hain
export const useSectionTone = () => useContext(SectionToneContext)

export function Section({ tone = 'background', visible = true, id, className, containerClassName, children }) {
  if (!visible) return null

  return (
    <SectionToneContext.Provider value={{ inverted: tone === 'navy' }}>
      <section id={id} className={cn('py-12 sm:py-14', tones[tone], className)}>
        <Container className={containerClassName}>{children}</Container>
      </section>
    </SectionToneContext.Provider>
  )
}
