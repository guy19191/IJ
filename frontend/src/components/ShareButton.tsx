import React, { useState, useRef } from 'react';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from '@mui/material';
import { Close as CloseIcon, Share as ShareIcon, Download as DownloadIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShareButtonProps {
  url: string;
  title: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, title }) => {
  const [open, setOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.text(title, 20, 20);

      // Add QR code
      const imgWidth = 100;
      const imgHeight = 100;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(
        imgData,
        'PNG',
        (pageWidth - imgWidth) / 2,
        (pageHeight - imgHeight) / 2,
        imgWidth,
        imgHeight
      );

      // Add URL
      pdf.setFontSize(12);
      pdf.text(url, 20, pageHeight - 20);

      pdf.save(`${title}-qr-code.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<ShareIcon />}
        onClick={handleOpen}
      >
        Share
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share {title}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Scan QR Code</Typography>
            <div ref={qrRef}>
              <QRCodeSVG value={url} size={200} />
            </div>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              sx={{ mt: 2 }}
            >
              Download QR Code PDF
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FacebookShareButton url={url} hashtag="#music">
                <Button variant="contained" color="primary">
                  Facebook
                </Button>
              </FacebookShareButton>

              <TwitterShareButton url={url} title={title}>
                <Button variant="contained" color="info">
                  Twitter
                </Button>
              </TwitterShareButton>

              <WhatsappShareButton url={url} title={title}>
                <Button variant="contained" color="success">
                  WhatsApp
                </Button>
              </WhatsappShareButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton; 