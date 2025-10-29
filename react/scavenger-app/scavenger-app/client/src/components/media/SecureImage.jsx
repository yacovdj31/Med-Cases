import React from 'react';
import { api } from '../../api';

/**
 * SecureImage
 * - If `directUrl` is provided, it will be fetched (blob) directly (e.g. `/boxes/:id/photo`)
 * - Else, it will fetch `/uploads/file/:fileId`
 * - Always sends credentials (cookies)
 */
export default function SecureImage({ fileId, directUrl, alt = '', className = '' }) {
  const [src, setSrc] = React.useState(null);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let stop = false;
    let url = null;

    async function load() {
      try {
        setErr('');
        const endpoint = directUrl || `/uploads/file/${fileId}`;
        const res = await api.get(endpoint, { responseType: 'blob', withCredentials: true });
        if (stop) return;
        url = URL.createObjectURL(res.data);
        setSrc(url);
      } catch (e) {
        if (!stop) setErr(e?.response?.data?.error || e.message || 'Load failed');
      }
    }
    if (directUrl || fileId) load();

    return () => {
      stop = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileId, directUrl]);

  if (err) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-xs text-red-600 ${className}`} title={err}>
        failed to load
      </div>
    );
  }

  return (
    <img
      src={src || ''}
      alt={alt}
      className={className}
      style={{ objectFit: 'cover' }}
    />
  );
}
