import api from './api';

export const getMarketData = async (symbol) => {
  const response = await api.get(`/market/data/${symbol}`);
  return response.data;
};

export const getAllMarketData = async () => {
  const response = await api.get('/market/data');
  return response.data;
};

export const searchMarketData = async (query) => {
  const response = await api.get('/market/search', { params: { query } });
  return response.data;
};

export const createMarketData = async (marketData) => {
  const response = await api.post('/market/data', marketData);
  return response.data;
};

export const updateMarketData = async (symbol, marketData) => {
  const response = await api.put(`/market/data/${symbol}`, marketData);
  return response.data;
};

export const deleteMarketData = async (symbol) => {
  const response = await api.delete(`/market/data/${symbol}`);
  return response.data;
};
