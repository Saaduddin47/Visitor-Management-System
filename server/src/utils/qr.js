import QRCode from 'qrcode';

export const buildRequestQrPayload = (request) =>
  JSON.stringify({
    requestId: String(request._id),
    visitId: request.visitId,
    referenceId: request.referenceId
  });

export const ensureRequestQrCode = async (request) => {
  if (!request?._id || !request?.visitId || !request?.referenceId) return request;
  request.qrCodeDataUrl = await QRCode.toDataURL(buildRequestQrPayload(request));
  return request;
};
