// frontend/src/api/hooks.ts
import { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useEmployees() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('employees/').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useProjects() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    api.get('projects')
      .then(res => {
        // Handle different response formats
        let projectsArray = [];
        if (Array.isArray(res.data)) {
          projectsArray = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          // Paginated response
          projectsArray = res.data.results;
        } else if (res.data && typeof res.data === 'object') {
          // Single object or other format
          projectsArray = Object.values(res.data);
        }
        
        setData(projectsArray);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setError(err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);
  
  return { data, loading, error };
}