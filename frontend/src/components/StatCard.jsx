import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ icon: Icon, title, value, valueColor = "text.primary", sx = {} }) => {
  return (
    <Card
      sx={{
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        minHeight: 90,
        boxShadow: 2,
        ...sx
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3
        }}
      >
        {Icon && (
          <Box sx={{ color: 'primary.main', display: 'flex' }}>
            <Icon size={30} />
          </Box>
        )}

        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: valueColor
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;