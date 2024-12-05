import React, { useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';

export interface Props {
  children: ReactNode;
}

export const Container: FC<Props> = ({ children }) => {
  const [isVisible, setVisible] = useState(true);

  useEffect(() => {
    // Empty effect
  }, []);

  return isVisible ? children : null;
};