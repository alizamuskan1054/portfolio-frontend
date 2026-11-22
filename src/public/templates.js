// Admin ke Templates page ke records (key: "academic", name: "Academic") yahan public site ke layout se jurte hain.
//
// Kaise kaam karta hai:
//   backend portfolio ke saath template ki `key` bhejta hai -> resolveTemplate(key) -> yeh site ka template.
//   Abhi sirf ek template hai ("academic"), isliye har portfolio isi par chalta hai.
//   Key na aaye ya anjaan ho to bhi "academic" (site 404 nahi hoti).
//
// Naya template aaye to: yahan ek entry add karo (aur layout.jsx mein uska layout chuno).
// Key admin mein banne ke baad badal nahi sakti, isliye yahan bhi wahi spelling rakho.

export const DEFAULT_TEMPLATE_KEY = 'academic'

export const TEMPLATES = {
  academic: { key: 'academic', name: 'Academic' },
}

export function resolveTemplate(key) {
  const normalized = typeof key === 'string' ? key.trim().toLowerCase() : ''
  return TEMPLATES[normalized] ?? TEMPLATES[DEFAULT_TEMPLATE_KEY]
}