import axios from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

export async function fetchData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await axios.get(url, config);
  return response.data;
}