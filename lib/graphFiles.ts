import { getAccessToken } from './graphMail';

// We store files in the OneDrive of the MAIL_FROM service account, under
// a CleanDispatch/ folder tree. Files are referenced everywhere by their
// Graph driveItem id and streamed back through /api/files/[id].

const DRIVE_OWNER = process.env.GRAPH_FILES_USER ?? process.env.MAIL_FROM ?? '';

function driveRoot(): string {
  if (!DRIVE_OWNER) {
    throw new Error('Missing GRAPH_FILES_USER / MAIL_FROM for file storage.');
  }
  return `https://graph.microsoft.com/v1.0/users/${DRIVE_OWNER}/drive`;
}

/**
 * Upload a file to the service-account OneDrive and return its driveItem id.
 * `path` is relative to the drive root, e.g. "CleanDispatch/cleaners/<id>/photo.jpg".
 */
export async function uploadFile(
  path: string,
  content: Buffer | ArrayBuffer,
  contentType: string
): Promise<{ driveItemId: string }> {
  const token = await getAccessToken();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const res = await fetch(`${driveRoot()}/root:/${encodedPath}:/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: (content instanceof Buffer ? new Uint8Array(content) : content) as BodyInit,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph upload failed (${res.status}): ${err}`);
  }

  const item = await res.json();
  return { driveItemId: item.id as string };
}

/**
 * Stream a stored file's bytes back. Returns the raw Response from Graph's
 * content endpoint so the caller can pipe body + content-type to the client.
 */
export async function fetchFile(
  driveItemId: string
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const token = await getAccessToken();

  const res = await fetch(`${driveRoot()}/items/${driveItemId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'follow',
  });

  if (!res.ok) {
    console.error(`Graph fetchFile failed (${res.status}) for ${driveItemId}`);
    return null;
  }

  return {
    body: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
  };
}
