import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  onConfirm,
  onClose,
}) => {
  const getConfirmColor = () => {
    switch (type) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      case 'default':
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: { borderRadius: 2, minWidth: { xs: 300, sm: 400 }, p: 1 }
      }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 'bold' }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" variant="text" sx={{ fontWeight: 'medium' }}>
          {cancelText}
        </Button>
        <Button onClick={() => {
            onConfirm();
            onClose();
        }} color={getConfirmColor()} variant="contained" disableElevation sx={{ fontWeight: 'bold' }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
