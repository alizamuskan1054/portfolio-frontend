// Cloudinary file ko "download" banana.
//
// Browser ka <a download> alag-domain (cross-origin) link par kaam nahi karta, isliye link sirf khul jata hai.
// Cloudinary ka `fl_attachment` flag URL mein lagane se Cloudinary khud "download karo" header bhejta hai.
//   .../image/upload/v1/media/cv/file   ->   .../image/upload/fl_attachment:Dr_Ahmad_CV/v1/media/cv/file
// Cloudinary ka URL na ho (ya flag pehle se ho) to URL jaisa hai waisa wapas.

export function forceDownload(url, name = '') {
  if (!url || typeof url !== 'string') return url ?? null
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(url)) return url
  if (!url.includes('/upload/') || url.includes('fl_attachment')) return url

  // Cloudinary file name mein sirf letters, numbers, - aur _ chalte hain
  const safe = String(name)
    .replace(/^(dr|prof)\.?\s+/i, '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const flag = safe ? `fl_attachment:${safe}_CV` : 'fl_attachment'

  return url.replace('/upload/', `/upload/${flag}/`)
}

// Favicon: Cloudinary se 64x64 PNG (square) mangwate hain. Isse original format (ico/webp/svg) ya lambi-chauri image
// browser tab mein kharab nahi dikhti. Cloudinary ka URL na ho to jaisa hai waisa.
export function faviconUrl(url) {
  if (!url || typeof url !== 'string') return url ?? null
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(url) || !url.includes('/upload/')) return url
  if (/\/upload\/[^/]*(f_|w_|h_|c_)/.test(url)) return url // pehle se transform laga hai
  return url.replace('/upload/', '/upload/f_png,w_64,h_64,c_fill/')
}