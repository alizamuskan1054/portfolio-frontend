// Object -> FormData (file upload wale forms ke liye).
// null/undefined fields skip hote hain. Arrays: har item same key par append.
// Plain objects JSON string ban jate hain.
export function toFormData(values) {
  const formData = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item))
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  })

  return formData
}

// File fields ke saath payload banata hai (image/file upload + "remove" dono).
//   data: baaki sab values + file fields ki values (File | purana URL string | null)
//   fileFields: file/image fields ke naam
//   original: server ka purana record (purani file thi ya nahi, ye isi se pata chalta hai)
// - Naya File chuna: multipart bhejta hai
// - Purani file hata di (value null, original mein thi): JSON mein `null`, multipart mein '' (DRF clear karta hai)
// - Purani file jas ki tas: field bheja hi nahi jata (warna PATCH fail hota hai)
export function buildFilePayload(data, fileFields, original = {}) {
  const rest = { ...data }
  const files = {}
  const cleared = []
  fileFields.forEach((name) => {
    const value = rest[name]
    delete rest[name]
    if (value instanceof File) files[name] = value
    else if (!value && original?.[name]) cleared.push(name)
  })

  if (Object.keys(files).length === 0) {
    cleared.forEach((name) => {
      rest[name] = null
    })
    return rest
  }

  const formData = toFormData({ ...rest, ...files })
  cleared.forEach((name) => formData.append(name, ''))
  return formData
}
