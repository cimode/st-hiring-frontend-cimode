import { useCallback, useEffect, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { EventCard } from './EventCard'
import {
  PAGE_SIZE_OPTIONS,
  fetchEvents,
  selectEvents,
  selectRangeLabel,
  setPage,
  setPageSize,
} from './eventsSlice'

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

export const EventsPage = () => {
  const dispatch = useAppDispatch()
  const { items, query, pagination, status, error } = useAppSelector(selectEvents)
  const rangeLabel = useAppSelector(selectRangeLabel)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isLoading = status === 'loading' || status === 'idle'

  useEffect(() => {
    const request = dispatch(fetchEvents(query))
    // Cancels the in-flight request when the query changes or the view unmounts
    // (which also makes the StrictMode double effect harmless).
    return () => request.abort()
  }, [dispatch, query])

  // The list can shrink between requests: fall back to the last page that exists.
  useEffect(() => {
    if (pagination && pagination.totalPages > 0 && query.page > pagination.totalPages) {
      dispatch(setPage(pagination.totalPages))
    }
  }, [dispatch, pagination, query.page])

  const handleRetry = useCallback(() => {
    dispatch(fetchEvents(query))
  }, [dispatch, query])

  const handlePageChange = (_event: unknown, page: number) => {
    dispatch(setPage(page))
    headingRef.current?.focus()
  }

  return (
    <Box component="section" aria-labelledby="events-heading">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            id="events-heading"
            ref={headingRef}
            tabIndex={-1}
            variant="h4"
            component="h2"
            sx={{ outline: 'none' }}
          >
            Events
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 20 }}>
            {rangeLabel}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="page-size-label">Events per page</InputLabel>
          <Select
            labelId="page-size-label"
            label="Events per page"
            value={query.pageSize}
            disabled={isLoading}
            onChange={(event) => dispatch(setPageSize(Number(event.target.value)))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box role="status" sx={visuallyHidden}>
        {isLoading ? 'Loading events…' : ''}
      </Box>

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

      {isLoading && (
        <Grid container spacing={2} aria-hidden="true">
          {Array.from({ length: Math.min(query.pageSize, 12) }, (_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      )}

      {status === 'succeeded' && items.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          No events to show yet.
        </Typography>
      )}

      {status === 'succeeded' && items.length > 0 && (
        <Grid container spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, mb: 0 }}>
          {items.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id} component="li">
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            aria-label="Events pagination"
            count={pagination.totalPages}
            page={Math.min(query.page, pagination.totalPages)}
            onChange={handlePageChange}
            disabled={isLoading}
            color="primary"
            siblingCount={0}
          />
        </Stack>
      )}
    </Box>
  )
}
