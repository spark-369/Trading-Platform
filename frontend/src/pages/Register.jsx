import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Link,
  Grid,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffRounded';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

const initialForm = {
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

/** Very light strength heuristic to nudge users towards better passwords. */
function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'inherit' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 33, label: 'Weak', color: 'error' };
  if (score <= 3) return { score: 66, label: 'Fair', color: 'warning' };
  return { score: 100, label: 'Strong', color: 'success' };
}

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = passwordStrength(form.password);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (form.username.trim().length < 3) errors.username = 'At least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (form.password.length < 6) errors.password = 'At least 6 characters';
    if (!form.firstName.trim()) errors.firstName = 'Required';
    if (!form.lastName.trim()) errors.lastName = 'Required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(
        form.username.trim(),
        form.email.trim(),
        form.password,
        form.firstName.trim(),
        form.lastName.trim()
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with a funded demo wallet and explore the market."
      footer={
        <>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" fontWeight={600} underline="hover">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username}
            autoComplete="username"
            autoFocus
            required
            fullWidth
          />

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                autoComplete="given-name"
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                autoComplete="family-name"
                required
                fullWidth
              />
            </Grid>
          </Grid>

          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
            autoComplete="email"
            required
            fullWidth
          />

          <Box>
            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              autoComplete="new-password"
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {form.password && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress variant="determinate" value={strength.score} color={strength.color} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                  <Box
                    component="span"
                    sx={{ typography: 'caption', color: `${strength.color}.main`, fontWeight: 600 }}
                  >
                    {strength.label}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ mt: 0.5 }}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  );
}

