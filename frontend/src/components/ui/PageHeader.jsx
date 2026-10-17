import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Consistent page heading used by every screen.
 * Renders an optional breadcrumb trail, title, subtitle and an actions slot.
 */
export default function PageHeader({ title, subtitle, actions, breadcrumbs = [] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator="/"
            sx={{ mb: 0.5, '& .MuiBreadcrumbs-separator': { mx: 0.75 } }}
          >
            {breadcrumbs.map((crumb, index) =>
              crumb.to && index < breadcrumbs.length - 1 ? (
                <MuiLink
                  key={crumb.label}
                  component={RouterLink}
                  to={crumb.to}
                  underline="hover"
                  color="text.secondary"
                  variant="caption"
                >
                  {crumb.label}
                </MuiLink>
              ) : (
                <Typography key={crumb.label} variant="caption" color="text.primary" fontWeight={600}>
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h4" component="h1" noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
}
