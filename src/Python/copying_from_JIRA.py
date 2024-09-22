import requests
from jira import JIRA
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime, timedelta

# 1. Configuration (Store in a separate `config.py` file and import)
jira_domain = ''
username = ''
api_token = ''
general_filter_id = '' 
tech_debt_filter_id = ''
labels = [''] 
spreadsheet_url = 'Google sheet URL'
sheet_name = 'SheetName'

# 2. Google Sheets Authentication
scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
creds = ServiceAccountCredentials.from_json_keyfile_name('your_credentials.json', scope) # Replace with your credentials file
client = gspread.authorize(creds)

# 3. Open Spreadsheet and Create New Sheet
spreadsheet = client.open_by_url(spreadsheet_url)
original_sheet = spreadsheet.worksheet(sheet_name)

tomorrow = datetime.now() + timedelta(days=1)
new_sheet_name = tomorrow.strftime('%b-%d-%Y')
new_sheet = original_sheet.duplicate(new_sheet_name=new_sheet_name)

# 4. Clear Data and Preserve Formulas
all_data = new_sheet.get_all_values()
formulas = [row[7] for row in all_data]  # Assuming formulas are in column H (index 7)

# Clear data but keep header row
new_sheet.clear()
new_sheet.append_row(all_data[0])  # Append the header row back

# Re-apply formulas to column H
for i, formula in enumerate(formulas[1:]):  # Skip header row
    new_sheet.update_cell(i + 2, 8, formula)  # Start from row 2

# 5. Fetch and Write Jira Tickets
def fetch_and_write_tickets(sheet, jira_domain, username, api_token, filter_id, labels, max_results):
    label_condition = ' OR '.join([f'labels = "{label}"' for label in labels])
    jql = f'filter = {filter_id} AND statusCategory != Done AND ({label_condition}) AND ((sprint is EMPTY AND "Story Points[Number]" is EMPTY) OR (sprint is not EMPTY AND "Story Points[Number]" is not EMPTY AND created <= -60d))'

    issues = call_jira_api(jira_domain, username, api_token, jql, max_results)['issues']

    # Group by project and limit to top 6 per project
    issues_by_project = {}
    for issue in issues:
        project_key = issue['fields']['project']['key']
        issues_by_project.setdefault(project_key, []).append(issue)
    issues_by_project = {k: v[:6] for k, v in issues_by_project.items()}

    rows = []
    for project_issues in issues_by_project.values():
        for issue in project_issues:
            created_date = datetime.strptime(issue['fields']['created'], '%Y-%m-%dT%H:%M:%S.%f%z')
            formatted_date = created_date.strftime('%m/%d/%Y %H:%M:%S')
            rows.append([
                issue['key'],
                issue['fields']['summary'],
                issue['fields']['assignee']['displayName'] if issue['fields'].get('assignee') else 'Unassigned',
                issue['fields']['reporter']['displayName'] if issue['fields'].get('reporter') else 'Unknown',
                issue['fields']['priority']['name'] if issue['fields'].get('priority') else 'N/A',
                issue['fields']['customfield_10000']['value'] if issue['fields'].get('customfield_10000') else 'N/A',
                formatted_date,
                ''  # Placeholder for Notes column
            ])

    if rows:
        sheet.append_rows(rows, value_input_option='USER_ENTERED')  # Append data, preserving formulas

# 6. Fetch and Write Tech Debt Tickets
def fetch_and_write_tech_debt_tickets(sheet, jira_domain, username, api_token, filter_id):
    jql = f'filter = {filter_id} AND statusCategory != Done AND ((sprint is EMPTY AND "Story Points[Number]" is EMPTY) OR (sprint is not EMPTY AND "Story Points[Number]" is not EMPTY AND created <= -60d)) ORDER BY created DESC'

    issue = call_jira_api(jira_domain, username, api_token, jql, 1)['issues'][0]

    created_date = datetime.strptime(issue['fields']['created'], '%Y-%m-%dT%H:%M:%S.%f%z')
    formatted_date = created_date.strftime('%m/%d/%Y %H:%M:%S')
    sheet.append_row([
        issue['key'],
        issue['fields']['summary'],
        issue['fields']['assignee']['displayName'] if issue['fields'].get('assignee') else 'Unassigned',
        issue['fields']['reporter']['displayName'] if issue['fields'].get('reporter') else 'Unknown',
        issue['fields']['priority']['name'] if issue['fields'].get('priority') else 'N/A',
        issue['fields']['customfield_10000']['value'] if issue['fields'].get('customfield_10000') else 'N/A',
        formatted_date,
        ''  # Placeholder for Notes column
    ], value_input_option='USER_ENTERED')  # Append data, preserving formulas

# 7. Call Jira API
def call_jira_api(jira_domain, username, api_token, jql, max_results):
    url = f'{jira_domain}/rest/api/2/search?jql={jql}&maxResults={max_results}'
    auth = (username, api_token)
    headers = {'Accept': 'application/json'}

    response = requests.get(url, auth=auth, headers=headers)
    response.raise_for_status()  # Raise an exception for bad status codes
    return response.json()

# 8. Main Execution
if __name__ == "__main__":
    fetch_and_write_tickets(new_sheet, jira_domain, username, api_token, general_filter_id, labels, 150)
    fetch_and_write_tech_debt_tickets(new_sheet, jira_domain, username, api_token, tech_debt_filter_id)