# Quick Reference: Error Handling & Loading States

## Import Components

```tsx
import { 
  ErrorBoundary, 
  ErrorFallback, 
  LoadingSpinner, 
  SkeletonLoader,
  StatCardSkeleton,
  PageLoading
} from '@/components/ui';
```

## Error Boundary Usage

### Wrap Components
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Custom Fallback
```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### With Error Callback
```tsx
<ErrorBoundary onError={(error, info) => logError(error, info)}>
  <YourComponent />
</ErrorBoundary>
```

## Error Fallback

### Basic Usage
```tsx
{error && <ErrorFallback error={error} />}
```

### With Retry
```tsx
{error && <ErrorFallback error={error} onRetry={handleRetry} />}
```

### Custom Title
```tsx
{error && (
  <ErrorFallback 
    error={error} 
    onRetry={handleRetry}
    title="Failed to load data"
  />
)}
```

## Loading States

### Loading Spinner
```tsx
// Small
<LoadingSpinner size="sm" />

// With message
<LoadingSpinner size="md" message="Loading data..." />

// Full screen
<LoadingSpinner size="lg" fullScreen />
```

### Skeleton Loaders
```tsx
// Generic skeleton
<SkeletonLoader />

// Stat card skeleton
<StatCardSkeleton />

// Full page loading
<PageLoading message="Loading dashboard..." />
```

### Conditional Rendering
```tsx
{isLoading ? (
  <SkeletonLoader />
) : (
  <ActualContent data={data} />
)}
```

## Common Patterns

### Data Fetching with Error & Loading
```tsx
function MyComponent() {
  const { data, error, isLoading } = useSomeData();
  
  if (error) {
    return <ErrorFallback error={error} onRetry={refetch} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }
  
  return <DataDisplay data={data} />;
}
```

### With Error Boundary
```tsx
<ErrorBoundary>
  <DataComponent />
</ErrorBoundary>
```

### Dashboard Pattern
```tsx
<ErrorBoundary>
  {error && <ErrorFallback error={error} onRetry={refresh} />}
  
  <DashboardStats 
    stats={stats}
    isLoading={isLoading}
  />
</ErrorBoundary>
```

## Avoid Hydration Errors

### ❌ Wrong (Block in Inline)
```tsx
<p className="text">
  {isLoading ? (
    <div className="skeleton" />
  ) : (
    "Text content"
  )}
</p>
```

### ✅ Correct (Same Level)
```tsx
{isLoading ? (
  <div className="skeleton" />
) : (
  <p className="text">Text content</p>
)}
```

## CSS Classes

### Loading Animation
```css
/* Already included in Tailwind */
animate-spin
animate-pulse
```

### Skeleton Styles
```tsx
className="h-4 bg-gray-200 rounded animate-pulse w-3/4"
```

## TypeScript Types

### Error Boundary Props
```tsx
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

### Error Fallback Props
```tsx
interface ErrorFallbackProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}
```

### Loading Spinner Props
```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}
```

## Quick Tips

1. **Always wrap async components** in ErrorBoundary
2. **Provide retry functions** for better UX
3. **Use skeleton loaders** for perceived performance
4. **Match skeleton shape** to actual content
5. **Avoid HTML nesting violations** (check console warnings)
6. **Test error scenarios** during development
7. **Keep loading messages** concise and helpful

## Testing Checklist

- [ ] Component wrapped in ErrorBoundary
- [ ] Error state displays ErrorFallback
- [ ] Loading state shows skeleton/spinner
- [ ] Retry button works
- [ ] No hydration warnings
- [ ] TypeScript compiles
- [ ] Build succeeds

## Common Issues & Solutions

### Issue: Error boundary not catching
**Solution**: Only catches render errors, not async. Use try/catch for async.

### Issue: Hydration mismatch
**Solution**: Check conditional rendering, ensure same HTML client/server.

### Issue: Loading state flickers
**Solution**: Add minimum display time or debounce state changes.

### Issue: Skeleton doesn't match content
**Solution**: Update skeleton dimensions to match actual layout.

---

**Need more details?** See `ERROR_HANDLING_README.md` and `IMPROVEMENTS_SUMMARY.md`

