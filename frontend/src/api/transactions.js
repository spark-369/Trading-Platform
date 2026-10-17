import api from './api';

export const getTransactionHistory = async (userId) => {
  const config = userId ? { params: { userId } } : {};
  const response = await api.get('/transactions/history', config);
  return response.data;
};

export const getTransaction = async (transactionId) => {
  const response = await api.get(`/transactions/${transactionId}`);
  return response.data;
};

export const getAllTransactions = async (userId) => {
  return getTransactionHistory(userId);
};

export const getTransactionsByUserId = async (userId) => {
  return getTransactionHistory(userId);
};
