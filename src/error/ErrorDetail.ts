
export type ErrorDetail = {
  message?: string;
  stack?: string;
  extra?: unknown[];
  cause?: ErrorDetail;
};
