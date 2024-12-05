export interface ServiceResponse<T> {
  status: "success" | "error";
  data: T;
}