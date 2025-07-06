# Analytics Export System

This module provides comprehensive analytics data export functionality for the MindBlock backend, allowing administrators to export analytics data in CSV and PDF formats for reporting, audits, and offline review.

## Features

### ✅ Export Formats
- **CSV Export**: Flat data format with headers (id, eventType, userId, timestamp, metadata)
- **PDF Export**: Formatted report with table layout and pagination
- **Default Format**: CSV (when no format specified)

### ✅ Filtering Capabilities
- **Time Range**: `from` and `to` parameters (ISO 8601 format)
- **Time Filters**: `weekly`, `monthly`, `all_time`
- **User Filtering**: Filter by specific `userId`
- **Session Filtering**: Filter by specific `sessionId`
- **Combined Filters**: All filters can be used together

### ✅ Security & Access Control
- **Admin Only Access**: Protected with `@RoleDecorator(Role.Admin)`
- **JWT Authentication**: Requires valid Bearer token
- **RBAC Enforcement**: Role-based access control

### ✅ File Download Features
- **Proper Headers**: Content-Type and Content-Disposition headers
- **Timestamped Filenames**: Automatic filename generation with timestamps
- **Cache Control**: No-cache headers for fresh downloads

## API Endpoints

### GET /analytics/export

Export analytics data in the specified format.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | `csv \| pdf` | No | `csv` | Export format |
| `timeFilter` | `weekly \| monthly \| all_time` | No | - | Time filter preset |
| `from` | `string` (ISO 8601) | No | - | Start date |
| `to` | `string` (ISO 8601) | No | - | End date |
| `userId` | `string` (UUID) | No | - | Filter by user ID |
| `sessionId` | `string` (UUID) | No | - | Filter by session ID |

#### Example Requests

```bash
# Export all analytics data in CSV format
GET /analytics/export?format=csv

# Export weekly data in PDF format
GET /analytics/export?format=pdf&timeFilter=weekly

# Export specific date range for a user
GET /analytics/export?format=csv&from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z&userId=123e4567-e89b-12d3-a456-426614174000

# Export session-specific data
GET /analytics/export?format=csv&sessionId=456e7890-e89b-12d3-a456-426614174000
```

#### Response Headers

```
Content-Type: text/csv | application/pdf
Content-Disposition: attachment; filename="analytics-export-2024-01-15.csv"
Cache-Control: no-cache
```

## Data Structure

### Analytics Event Entity

```typescript
interface AnalyticsEvent {
  id: number;
  eventType: string;
  userId: number;
  metadata: Record<string, any>;
  createdAt: Date;
}
```

### CSV Export Format

```csv
id,eventType,userId,timestamp,metadata
1,puzzle_solved,123,2024-01-01T10:00:00.000Z,"{""puzzleId"":""puzzle-1"",""difficulty"":""easy""}"
2,iq_question_answered,456,2024-01-02T11:00:00.000Z,"{""questionId"":""iq-1"",""correct"":true}"
```

### PDF Export Format

The PDF export includes:
- **Header**: Title and generation timestamp
- **Summary**: Total record count
- **Data Table**: Formatted table with all event data
- **Pagination**: Automatic page breaks for large datasets

## Implementation Details

### Services

#### AnalyticsExportService

Main service responsible for data export functionality:

```typescript
class AnalyticsExportService {
  async exportAnalytics(data: AnalyticsEvent[], format: ExportFormat, res: Response): Promise<void>
  private async exportToCsv(data: AnalyticsEvent[], res: Response): Promise<void>
  private async exportToPdf(data: AnalyticsEvent[], res: Response): Promise<void>
  generateFilename(format: ExportFormat): string
}
```

#### AnalyticsService

Enhanced with filtering capabilities:

```typescript
class AnalyticsService {
  async findAll(query: GetAnalyticsQueryDto): Promise<AnalyticsEvent[]>
  async getAnalytics(query: GetAnalyticsQueryDto): Promise<AnalyticsEvent[]>
}
```

### DTOs

#### ExportAnalyticsQueryDto

Extends the base query DTO with format specification:

```typescript
class ExportAnalyticsQueryDto extends GetAnalyticsQueryDto {
  format?: ExportFormat = ExportFormat.CSV;
}
```

#### ExportFormat Enum

```typescript
enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}
```

## Error Handling

### Validation Errors
- **Invalid Date Format**: Returns 400 for malformed date strings
- **Invalid Export Format**: Returns 400 for unsupported formats
- **Invalid UUID**: Returns 400 for malformed user/session IDs

### Service Errors
- **Database Errors**: Properly logged and propagated
- **Export Errors**: Graceful handling of CSV/PDF generation failures
- **Memory Issues**: Efficient streaming for large datasets

## Testing

### Unit Tests
- **AnalyticsExportService**: Tests for CSV/PDF generation
- **AnalyticsController**: Tests for endpoint behavior
- **Error Scenarios**: Tests for various error conditions

### Integration Tests
- **End-to-End**: Full request/response cycle testing
- **Data Integrity**: Verification of exported data accuracy
- **Filter Validation**: Testing of all filter combinations

### Test Coverage
- **Service Methods**: 100% coverage of export functionality
- **Controller Endpoints**: Full endpoint testing
- **Error Handling**: Comprehensive error scenario testing

## Usage Examples

### Frontend Integration

```typescript
// Download CSV export
const downloadCsvExport = async (filters: ExportFilters) => {
  const response = await fetch('/analytics/export?format=csv&timeFilter=weekly', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analytics-export.csv';
  a.click();
};

// Download PDF export
const downloadPdfExport = async (filters: ExportFilters) => {
  const response = await fetch('/analytics/export?format=pdf&from=2024-01-01&to=2024-01-31', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analytics-export.pdf';
  a.click();
};
```

### Backend Integration

```typescript
// In your service
@Injectable()
export class ReportService {
  constructor(private readonly analyticsExportService: AnalyticsExportService) {}

  async generateWeeklyReport(res: Response) {
    const data = await this.analyticsService.findAll({ timeFilter: 'weekly' });
    await this.analyticsExportService.exportAnalytics(data, ExportFormat.PDF, res);
  }
}
```

## Performance Considerations

### Large Dataset Handling
- **Streaming**: CSV export uses streaming for memory efficiency
- **Pagination**: PDF export includes automatic page breaks
- **Chunking**: Large datasets are processed in chunks

### Memory Management
- **No Memory Leaks**: Proper cleanup of file streams
- **Efficient Processing**: Minimal memory footprint during export
- **Timeout Handling**: Graceful handling of long-running exports

## Security Considerations

### Access Control
- **Admin Only**: Strict role-based access control
- **Token Validation**: JWT token verification
- **Input Validation**: Comprehensive parameter validation

### Data Protection
- **No Sensitive Data**: Metadata is sanitized before export
- **Audit Trail**: All export requests are logged
- **Rate Limiting**: Consider implementing rate limiting for large exports

## Future Enhancements

### Planned Features
- **Excel Export**: XLSX format support
- **Custom Templates**: User-defined export templates
- **Scheduled Exports**: Automated export scheduling
- **Email Delivery**: Direct email delivery of exports
- **Compression**: ZIP compression for large files

### Performance Improvements
- **Background Processing**: Async export processing
- **Caching**: Export result caching
- **Parallel Processing**: Multi-threaded export generation

## Troubleshooting

### Common Issues

1. **Empty Export**: Check filter parameters and data availability
2. **Large File Size**: Consider using time filters to limit data
3. **Memory Issues**: Implement pagination for very large datasets
4. **Authentication Errors**: Verify admin role and valid JWT token

### Debug Mode

Enable debug logging for export operations:

```typescript
// In your service
private readonly logger = new Logger(AnalyticsExportService.name);

// Debug logging
this.logger.debug(`Exporting ${data.length} records in ${format} format`);
```

## Contributing

When contributing to the analytics export system:

1. **Follow Testing**: Ensure all new features have corresponding tests
2. **Documentation**: Update this README for any new features
3. **Performance**: Consider performance impact of new features
4. **Security**: Validate all security implications
5. **Backward Compatibility**: Maintain API compatibility 