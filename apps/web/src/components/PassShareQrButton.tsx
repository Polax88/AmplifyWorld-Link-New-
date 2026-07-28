'use client';

import { useState } from 'react';
import { QrCode as QrCodeIcon } from 'lucide-react';
import { IconButton, Modal, QrCode } from '@amplifyworld/ui';

/** Fork of ShareQrButton pointed at a pass's public share page instead of the artist's own `/[handle]` page. */
export function PassShareQrButton({ passId }: { passId: string }) {
  const [open, setOpen] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pass/${passId}`;

  return (
    <>
      <IconButton aria-label="Show pass QR code" variant="secondary" onClick={() => setOpen(true)}>
        <QrCodeIcon className="size-4" />
      </IconButton>
      <Modal open={open} onOpenChange={setOpen} title="Share this pass" description={url}>
        <div className="flex justify-center py-2">
          <QrCode value={url} size={180} downloadable downloadFileName={`pass-${passId}-qr.png`} />
        </div>
      </Modal>
    </>
  );
}
