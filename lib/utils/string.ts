
export const isJson = (str: string) => {
  try {
    JSON.parse(str);
    return true
  } catch (e) {
    console.log('isJson error', e)
    return false
  }
}

export const formatJson = (str: string) => {
  if (!isJson(str)) return str
  return JSON.stringify(JSON.parse(str), null, 2)
}