/**
 * Mengecek apakah nilai logo merupakan URL gambar atau data URI (base64)
 */
export function isImageLogo(logo) {
  return (
    typeof logo === 'string' &&
    (logo.startsWith('data:image/') ||
      logo.startsWith('http://') ||
      logo.startsWith('https://') ||
      logo.startsWith('blob:'))
  )
}

/**
 * Membaca dan mengompres file gambar dari galeri/perangkat menjadi data URI base64 yang ringan
 * Cocok disimpan langsung di Firestore & localStorage tanpa melebihi kuota.
 */
export function compressImageFile(file, maxDimension = 320, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gagal memuat gambar.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Gunakan WebP jika didukung, fallback ke JPEG
        try {
          const webp = canvas.toDataURL('image/webp', quality)
          if (webp.startsWith('data:image/webp')) {
            resolve(webp)
            return
          }
        } catch {
          // ignore
        }

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = event.target.result
    }

    reader.readAsDataURL(file)
  })
}
