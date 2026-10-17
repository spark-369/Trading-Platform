import { useMemo, useState } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/MenuRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import InsightsIcon from '@mui/icons-material/InsightsRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../theme/ThemeModeContext';
import { buildNavGroups, routeMeta } from './navigation';

const DRAWER_WIDTH = 260;

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const { mode, toggle } = useThemeMode();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isAdmin = hasRole('ROLE_ADMIN');
  const navGroups = useMemo(() => buildNavGroups(isAdmin), [isAdmin]);
  const current = routeMeta[location.pathname] ?? { title: '', group: '' };

  const initials = (user?.username ?? '?').slice(0, 2).toUpperCase();
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Account';

  const closeDrawer = () => setMobileOpen(false);

  const handleLogout = () => {
    setMenuAnchor(null);
    logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5, gap: 1.25, minHeight: { xs: 64, md: 68 } }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            flexShrink: 0,
          }}
        >
          <InsightsIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ letterSpacing: '-0.01em' }}>
            Trading Platform
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Markets &amp; Portfolio
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 2 }}>
        {navGroups.map((section) => (
          <Box key={section.group} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              color="text.disabled"
              sx={{ px: 1.5, display: 'block', mb: 0.5 }}
            >
              {section.group}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    onClick={closeDrawer}
                    selected={active}
                    sx={{
                      py: 1,
                      color: active ? 'primary.main' : 'text.secondary',
                      fontWeight: active ? 600 : 500,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, mode === 'dark' ? 0.18 : 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, mode === 'dark' ? 0.24 : 0.15),
                        },
                      },
                      '&:hover': { color: active ? 'primary.main' : 'text.primary' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'inherit' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '0.8125rem',
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Chip
          size="small"
          label={isAdmin ? 'Administrator' : 'Trader'}
          color={isAdmin ? 'secondary' : 'default'}
          variant={isAdmin ? 'filled' : 'outlined'}
          sx={{ mt: 1.25 }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(12px)',
          zIndex: theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 64, md: 68 } }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {current.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {current.group}
            </Typography>
          </Box>

          <Tooltip title={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            <IconButton onClick={toggle} aria-label="Toggle colour theme">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ p: 0.5, borderRadius: 2 }}
            aria-label="Open account menu"
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{ '& .MuiBadge-badge': { bgcolor: 'success.main', boxShadow: '0 0 0 2px' } }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: '0.8125rem',
                }}
              >
                {initials}
              </Avatar>
            </Badge>
            {isDesktop && (
              <KeyboardArrowDownIcon sx={{ fontSize: 18, ml: 0.5, color: 'text.secondary' }} />
            )}
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 230 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate('/portfolio');
              }}
            >
              <PersonIcon sx={{ fontSize: 18, mr: 1.25, color: 'text.secondary' }} />
              My portfolio
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ fontSize: 18, mr: 1.25 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 68 } }} />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

