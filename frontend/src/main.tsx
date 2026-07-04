import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '#/lib/queryClient';
import { KitaMap } from '#/components/KitaMapOptimized';
import '#/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <KitaMap />
    </QueryClientProvider>
  </StrictMode>
);
