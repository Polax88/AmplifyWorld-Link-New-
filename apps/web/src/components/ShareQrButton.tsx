'use client';

import { useState } from 'react';
import { QrCode as QrCodeIcon } from 'lucide-react';
import { IconButton, Modal, QrCode } from '@amplifyworld/ui';

export function ShareQrButton({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/${handle}`;

  return (
    <>
      <IconButton aria-label="Show QR code" variant="secondary" onClick={() => setOpen(true)}>
        <QrCodeIcon className="size-4" />
      </IconButton>
      <Modal open={open} onOpenChange={setOpen} title="Share this page" description={url}>
        <div className="flex justify-center py-2">
          <QrCode value={url} size={180} downloadable downloadFileName={`${handle}-qr.png`} />
        </div>
      </Modal>
    </>
  );
}
