import { Box, Typography, Stack, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/InsightsRounded';
import ShieldIcon from '@mui/icons-material/VerifiedUserRounded';
import BoltIcon from '@mui/icons-material/BoltRounded';

const highlights = [
  { icon: BoltIcon, text: 'Live market data and instant order execution' },
  { icon: ShieldIcon, text: 'Bank-grade JWT authentication and role controls' },
  { icon: InsightsIcon, text: 'Track positions, P&L and wallet in one place' },
];

/**
 * Two column shell for the public pages: brand story on the left, form on the
 * right. On small screens only the form panel is shown.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Brand panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: { lg: '46%', xl: '50%' },
          p: 6,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main} 140%)`,
        }}
      >
        {/* Decorative glow */}
        <Box
          sx={{
            position: 'absolute',
            width: 460,
            height: 460,
            borderRadius: '50%',
            top: -160,
            right: -140,
            background: alpha('#ffffff', 0.08),
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            bottom: -120,
            left: -90,
            background: alpha('#ffffff', 0.06),
          }}
        />

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: alpha('#ffffff', 0.16),
            }}
          >
            <InsightsIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
              Trading Platform
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Markets &amp; Portfolio
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 460 }}>
          <Typography variant="h2" sx={{ color: '#fff', mb: 2, lineHeight: 1.15 }}>
            Trade smarter with real-time insight.
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mb: 4 }}>
            Research the market, manage your portfolio and monitor every transaction from a single
            dashboard.
          </Typography>
          <Stack spacing={2}>
            {highlights.map((item) => (
              <Box key={item.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: alpha('#ffffff', 0.14),
                    flexShrink: 0,
                  }}
                >
                  <item.icon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Chip
            size="small"
            label="Simulated trading environment"
            sx={{
              bgcolor: alpha('#ffffff', 0.14),
              color: '#fff',
              '& .MuiChip-label': { px: 1.5 },
            }}
          />
        </Box>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Compact brand mark for small screens */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 1.25,
              mb: 4,
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 34,
                height: 34,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <InsightsIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Trading Platform
            </Typography>
          </Box>

          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}

          {children}

          {footer && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {footer}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
