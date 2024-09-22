require 'google/apis/sheets_v4'
require 'googleauth'
require 'googleauth/stores/file_token_store'
require 'jira-ruby'
require 'date'

# 1. Configuration (Store in a separate YAML or .env file and load)
jira_domain = ''
username = ''
api_token = ''
general_filter_id = '' 
tech_debt_filter_id = ''
labels = [''] 
spreadsheet_url = 'Google sheet URL'
sheet_name = 'SheetName'

# 2. Google Sheets Authentication (using googleauth gem)
#  - Set up OAuth2 credentials and authorization (refer to googleauth gem documentation)

service = Google::Apis::SheetsV4::SheetsService.new
service.client_options.application_name = 'YourAppName'
service.authorization = # ... your authorization object

# 3. Open Spreadsheet and Create New Sheet
spreadsheet = service.get_spreadsheet(spreadsheet_id_from_url(spreadsheet_url))
original_sheet = spreadsheet.sheets.find { |s| s.properties.title == sheet_name }
raise "Original sheet not found: #{sheet_name}" unless original_sheet

tomorrow = Date.today + 1
new_sheet_name = tomorrow.strftime('%b-%d-%Y')

# (You'll likely need to use the Google Sheets API to duplicate the sheet and set its name)

# 4. Clear Data and Preserve Formulas
range = "#{sheet_name}!A1:Z" # Adjust range as needed
response = service.get_spreadsheet_values(spreadsheet.spreadsheet_id, range)
values = response.values
formulas = values.map { |row| [row[7]] } # Assuming formulas are in column H (index 7)

# Clear data but keep header row
requests = [
  {
    update_cells: {
      range: {
        sheet_id: new_sheet.properties.sheet_id,
        start_row_index: 1, # Start from row 2 (below header)
        end_row_index: new_sheet.properties.grid_properties.row_count,
        start_column_index: 0,
        end_column_index: new_sheet.properties.grid_properties.column_count
      },
      fields: 'userEnteredValue'
    }
  }
]

service.batch_update_spreadsheet(spreadsheet.spreadsheet_id, {
    requests: requests
})

# Re-apply formulas to column H
# (You'll likely need to use the Google Sheets API to update specific cells with formulas)

# 5. Fetch and Write Jira Tickets (using 'jira-ruby' gem)
def fetch_and_write_tickets(sheet, jira_domain, username, api_token, filter_id, labels, max_results)
  # ... (implementation using jira-ruby to fetch issues and process data)

  # Update Google Sheet with rows (using Google Sheets API)
end

# 6. Fetch and Write Tech Debt Tickets
def fetch_and_write_tech_debt_tickets(sheet, jira_domain, username, api_token, filter_id)
  # ... (implementation using jira-ruby to fetch tech debt issue)

  # Append row to Google Sheet (using Google Sheets API)
end

# 7. Call Jira API (using 'jira-ruby' gem)
def call_jira_api(jira_domain, username, api_token, jql, max_results)
  options = { :username => username, :password => api_token }
  client = JIRA::Client.new(options)

  # Search for issues using JQL
  issues = client.Issue.jql(jql, max_results: max_results)
  return { 'issues' => issues } 
end

# 8. Main Execution
if __FILE__ == $0
  fetch_and_write_tickets(new_sheet, jira_domain, username, api_token, general_filter_id, labels, 150)
  fetch_and_write_tech_debt_tickets(new_sheet, jira_domain, username, api_token, tech_debt_filter_id)
end