const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET

export async function uploadImage(file: File, folder = 'patwua/avatars'): Promise<string> {
  if (!CLOUD || !PRESET) throw new Error('Cloudinary env not set')
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file')

  // basic size guard (10MB)
  if (file.size > 10 * 1024 * 1024) throw new Error('Image too large (max 10MB)')

  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', PRESET)
  fd.append('folder', folder)              // nice to group uploads
  fd.append('context', `alt=${file.name}`) // optional

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Upload failed')
  }
  // data.secure_url is the safest canonical URL
  return data.secure_url as string
}

export async function uploadToCloudinary(file: File, folder = 'patwua/posts'): Promise<string> {
  if (!CLOUD || !PRESET) throw new Error('Cloudinary env not set')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', PRESET)
  fd.append('folder', folder)
  const type = file.type.startsWith('video/') ? 'video' : 'image'
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${type}/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
  return data.secure_url as string
}

export function avatarUrl(url: string, size = 128) {
  // turn: https://res.cloudinary.com/<cloud>/image/upload/v.../file.jpg
  // into: https://res.cloudinary.com/<cloud>/image/upload/c_fill,g_face,r_max,w_128,h_128,q_auto,f_auto/<rest>
  return url.replace('/upload/', `/upload/c_fill,g_face,r_max,w_${size},h_${size},q_auto,f_auto/`)
}
