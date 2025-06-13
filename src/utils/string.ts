export const checkName = (name: string) => {
  return /^[a-zA-Z0-9_-]+$/.test(name)
}

export const getUrlParams = (url: string) => {
  const query = url.split('?')[1]
  return new URLSearchParams(query)
}
