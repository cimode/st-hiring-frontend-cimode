import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { getIn, useFormik } from 'formik'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatEventDate } from '../../utils/format'
import { TICKETING_LIMITS, settingsSchema, toSettingsPayload } from './settingsSchema'
import { clearServerFieldError, fetchSettings, saveSettings, selectSettings } from './settingsSlice'
import { CURRENCIES, type Settings, type StoredSettings } from './types'

const toFormValues = ({ general, ticketing, notifications }: StoredSettings): Settings => ({
  general,
  ticketing,
  notifications,
})

interface SettingsFormProps {
  settings: StoredSettings
}

const SettingsForm = ({ settings }: SettingsFormProps) => {
  const dispatch = useAppDispatch()
  const { saveError, serverFieldErrors } = useAppSelector(selectSettings)
  const [savedOpen, setSavedOpen] = useState(false)
  const initialValues = useMemo(() => toFormValues(settings), [settings])

  const formik = useFormik<Settings>({
    initialValues,
    // The saved settings come back from the server and become the new pristine state.
    enableReinitialize: true,
    validationSchema: settingsSchema,
    onSubmit: async (values) => {
      const result = await dispatch(saveSettings(toSettingsPayload(values)))
      if (saveSettings.fulfilled.match(result)) setSavedOpen(true)
    },
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.target
    if (serverFieldErrors[name]) dispatch(clearServerFieldError(name))
    formik.handleChange(event)
  }

  const fieldProps = (name: string) => {
    const clientError = getIn(formik.touched, name) ? getIn(formik.errors, name) : undefined
    const message: string | undefined = clientError ?? serverFieldErrors[name]
    return {
      id: name,
      name,
      value: getIn(formik.values, name),
      onChange: handleChange,
      onBlur: formik.handleBlur,
      error: Boolean(message),
      helperText: message ?? ' ',
      fullWidth: true,
    }
  }

  const checkboxProps = (name: string) => ({
    name,
    checked: Boolean(getIn(formik.values, name)),
    onChange: handleChange,
  })

  return (
    <Box component="form" noValidate onSubmit={formik.handleSubmit} aria-labelledby="settings-heading">
      <Stack spacing={3}>
        {saveError && <Alert severity="error">{saveError}</Alert>}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h3" gutterBottom>
            General
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Site name" required {...fieldProps('general.siteName')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Support email"
                type="email"
                required
                {...fieldProps('general.supportEmail')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Currency" select required {...fieldProps('general.currency')}>
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Ticketing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max tickets per order"
                type="number"
                required
                inputProps={{ ...TICKETING_LIMITS.maxTicketsPerOrder, step: 1 }}
                {...fieldProps('ticketing.maxTicketsPerOrder')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Reservation timeout (minutes)"
                type="number"
                required
                inputProps={{ ...TICKETING_LIMITS.reservationTimeoutMinutes, step: 1 }}
                {...fieldProps('ticketing.reservationTimeoutMinutes')}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Notifications
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox {...checkboxProps('notifications.emailEnabled')} />}
              label="Email notifications"
            />
            <FormControlLabel
              control={<Checkbox {...checkboxProps('notifications.smsEnabled')} />}
              label="SMS notifications"
            />
          </FormGroup>
        </Paper>

        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            {settings.updatedAt
              ? `Last saved ${formatEventDate(settings.updatedAt)}`
              : 'These settings have never been saved.'}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            disabled={!formik.dirty || formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Saving…' : 'Save settings'}
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={savedOpen}
        autoHideDuration={4000}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" role="status" variant="filled" onClose={() => setSavedOpen(false)}>
          Settings saved
        </Alert>
      </Snackbar>
    </Box>
  )
}

export const SettingsPage = () => {
  const dispatch = useAppDispatch()
  const { data, status, error } = useAppSelector(selectSettings)

  useEffect(() => {
    const request = dispatch(fetchSettings())
    return () => request.abort()
  }, [dispatch])

  const handleRetry = useCallback(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  return (
    <Box component="section" aria-labelledby="settings-heading" sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography id="settings-heading" variant="h4" component="h2" sx={{ mb: 3 }}>
        Settings
      </Typography>

      {status === 'failed' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!data && status !== 'failed' && (
        <Stack role="status" alignItems="center" spacing={2} sx={{ py: 6 }}>
          <CircularProgress aria-hidden="true" />
          <Typography color="text.secondary">Loading settings…</Typography>
        </Stack>
      )}

      {data && status !== 'failed' && <SettingsForm settings={data} />}
    </Box>
  )
}
