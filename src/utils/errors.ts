export type AppErrorCode =
  | 'FILE_NOT_DICOM'
  | 'FILE_READ_FAILED'
  | 'DICOM_PARSE_FAILED'
  | 'DICOM_UNSUPPORTED_TRANSFER_SYNTAX'
  | 'DICOM_DECODE_FAILED'
  | 'DICOM_REGISTRATION_FAILED'
  | 'VIEWPORT_INIT_FAILED'
  | 'VIEWPORT_RENDER_FAILED'
  | 'JPEG_EXPORT_FAILED'
  | 'ZIP_EXPORT_FAILED'
  | 'PRIVACY_RULE_VIOLATION';

export interface AppError {
  code: AppErrorCode;
  message: string;
  fileId?: string;
  cause?: unknown;
}

export function createAppError(
  code: AppErrorCode,
  message: string,
  options: { fileId?: string; cause?: unknown } = {}
): AppError {
  return {
    code,
    message,
    ...(options.fileId ? { fileId: options.fileId } : {}),
    ...(options.cause !== undefined ? { cause: options.cause } : {})
  };
}
