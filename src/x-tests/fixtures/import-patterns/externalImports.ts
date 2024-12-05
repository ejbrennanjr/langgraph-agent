// Default external import
import React from 'react';

// Named external imports
import { useState, useEffect } from 'react';

// External type imports
import type { ReactNode } from 'react';

// Namespace external import
import * as ReactDOM from 'react-dom';

// Mixed external imports
import axios, { AxiosResponse } from 'axios';

export function Component({ children }: { children: ReactNode }) {
  const [state, setState] = useState(false);
  
  useEffect(() => {
    axios.get('/api').then((response: AxiosResponse) => {
      setState(true);
    });
  }, []);
  
  return React.createElement('div', {}, children);
}