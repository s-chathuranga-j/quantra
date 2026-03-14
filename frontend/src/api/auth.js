import api from './axios'

export const login = (username, password) =>
  api.post('/auth/login/', { username, password })

export const register = (data) =>
  api.post('/auth/register/', data)

export const getMe = () =>
  api.get('/auth/me/')

export const refreshToken = (refresh) =>
  api.post('/auth/token/refresh/', { refresh })

export const getUsers = (query = '') =>
  api.get(`/auth/users/${query ? `?q=${query}` : ''}`)
