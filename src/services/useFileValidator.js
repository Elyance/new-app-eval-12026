export function useFileValidator() {
  async function readBytes(file, n) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(new Uint8Array(e.target.result))
      reader.readAsArrayBuffer(file.slice(0, n))
    })
  }

  async function isRealCsv(file) {
    if (!file?.name?.match(/\.csv$/i)) return false
    const bytes = await readBytes(file, 512)
    for (let i = 0; i < Math.min(bytes.length, 100); i++) {
      const b = bytes[i]
      if (b < 9 || (b > 13 && b < 32 && b !== 27)) return false
    }
    return true
  }

  async function isRealZip(file) {
    if (!file?.name?.match(/\.zip$/i)) return false
    const bytes = await readBytes(file, 4)
    return bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04
  }

  async function validateFiles({ csv1, csv2, csv3, zip }) {
    const errors = []
    if (csv1 && !await isRealCsv(csv1)) errors.push('Fichier 1 : CSV invalide')
    if (csv2 && !await isRealCsv(csv2)) errors.push('Fichier 2 : CSV invalide')
    if (csv3 && !await isRealCsv(csv3)) errors.push('Fichier 3 : CSV invalide')
    if (zip && !await isRealZip(zip)) errors.push('Fichier ZIP invalide')
    return errors
  }

  return { validateFiles }
}