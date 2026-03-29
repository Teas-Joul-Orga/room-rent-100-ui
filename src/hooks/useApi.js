import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (config, options = {}) => {
    const { 
      showToast = true, 
      successMessage = null, 
      errorMessage = "An error occurred" 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await api(config);
      if (showToast && successMessage) {
        toast.success(successMessage);
      }
      return [response.data, null];
    } catch (err) {
      const errorData = err.response?.data || {};
      const finalErrorMessage = errorData.message || errorData.error || errorMessage;
      
      setError(finalErrorMessage);
      
      if (showToast) {
        // If it's a validation error (422), show all errors
        if (err.response?.status === 422 && errorData.errors) {
          Object.values(errorData.errors).flat().forEach(msg => toast.error(msg));
        } else {
          toast.error(finalErrorMessage);
        }
      }
      
      return [null, err];
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};
