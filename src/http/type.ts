export interface RequestSuccessResponse<T> {
  data: T;
}

export interface RequestErrorResponse {
  readonly error: {
    readonly message: string;
    readonly code: number;
  };
}

export type RequestOptions = {
  silent?: boolean;
};
