import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates module fixtures demonstrating external module imports and usage.
 */
export async function generateExternalModules(): Promise<Fixture[]> {
  return [
    {
      filename: "apiClient.ts",
      content: `
        import axios from 'axios';
        import type { AxiosResponse, AxiosRequestConfig } from 'axios';

        export async function fetchData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
          const response: AxiosResponse<T> = await axios.get(url, config);
          return response.data;
        }
      `,
    },
    {
      filename: "dataUtils.ts",
      content: `
        import { merge, pick, omit } from 'lodash';
        import type { Dictionary } from 'lodash';

        export function mergeObjects<T>(obj1: T, obj2: Partial<T>): T {
          return merge({}, obj1, obj2);
        }

        export function pickFields<T extends Dictionary<any>>(
          obj: T,
          fields: Array<keyof T>
        ): Partial<T> {
          return pick(obj, fields);
        }
      `,
    },
    {
      filename: "component.ts",
      content: `
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
      `,
    },
  ];
}
