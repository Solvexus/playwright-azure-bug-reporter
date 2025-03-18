export function getAuthHeader(token: string | undefined) {
  const encodedToken = Buffer.from(`:${token}`).toString("base64");
  return { Authorization: `Basic ${encodedToken}` };
}
